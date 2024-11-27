import fs from 'fs';
import base64url from 'base64url';
import path from 'path';

const configFilePath = path.resolve('./src/config.json')

const configTemplate = {
  log: {
    access: "",
    error: "",
    loglevel: "warning"
  },
  inbounds: [
    {
      tag: "socks",
      port: 10808,
      listen: "127.0.0.1",
      protocol: "socks",
      sniffing: {
        enabled: true,
        destOverride: ["http", "tls"]
      },
      settings: {
        auth: "noauth",
        udp: true,
        allowTransparent: false
      }
    },
    {
      tag: "http",
      port: 10809,
      listen: "127.0.0.1",
      protocol: "http",
      sniffing: {
        enabled: true,
        destOverride: ["http", "tls"]
      },
      settings: {
        auth: "noauth",
        udp: true,
        allowTransparent: false
      }
    }
  ],
  outbounds: [
    {
      tag: "direct",
      protocol: "freedom",
      settings: {}
    },
    {
      tag: "block",
      protocol: "blackhole",
      settings: {
        response: {
          type: "http"
        }
      }
    }
  ],
  routing: {
    domainStrategy: "IPIfNonMatch",
    domainMatcher: "hybrid",
    rules: [
      {
        type: "field",
        domain: ["geosite:category-ads-all"],
        outboundTag: "block"
      },
      {
        type: "field",
        domain: ["geosite:cn"],
        outboundTag: "direct"
      },
      {
        type: "field",
        ip: ["geoip:private", "geoip:cn"],
        outboundTag: "direct"
      },
      {
        type: "field",
        port: "0-65535",
        outboundTag: "proxy"
      }
    ]
  }
};

function decodeVmessLink(config) {
  const [protocol, encodedConfig] = config.split('://');
  const decodedStr = base64url.decode(encodedConfig);
  const configData = JSON.parse(decodedStr);
  configData.protocol = protocol
  return configData
}

function decodeTrolessLink(link) {
    const [protocol, rest] = link.split("://");
    // Split the link into parts before and after the "?"
    const [uuidAndHost, params] = rest.split('?');
    // Extract uuid and host 
    const [id, hostAndPort] = uuidAndHost.split('@');
    // Extract host and port
    const [add, port] = hostAndPort.split(':');
    // Extract query params
    const queryParams = new URLSearchParams(params.split('#')[0]);
    const scy = queryParams.get('security');
    const net = queryParams.get('type');
    const type = queryParams.get('headerType');
    const ps = decodeURIComponent(params.split('#')[1])

    return {
      protocol,
      id,
      add,
      port,
      scy,
      net,
      type,
      ps
    };
}

function decodeSSLink(link) {
  const rest = link.split("://")[1];
  const [base64, uri] = rest.split("#");
  const decoded = base64url.decode(base64);
  const [methodAndId, hostAndPort] = decoded.split("@");
  const [method, id] = methodAndId.split(":");
  const [add, port] = hostAndPort.split(":");
  const ps = decodeURIComponent(uri)
  return {
    protocol: "shadowsocks",
    method,
    id,
    add,
    port,
    ps
  }
}

function createOutbound(config) {
  const protocol = config.protocol // Extract the protocol

  switch (protocol) {
    case 'shadowsocks': // Shadowsocks
      return{
        tag: "proxy",
        protocol: config.protocol,
        settings: {
          servers: [
            {
              address: config.add,
              port: config.port,
              method: config.method, // Assuming method exists
              password: config.uuid,
              email: "user@example.com",
              ota: false
            }
          ]
        },
        streamSettings: {
            network: config.net || "tcp",
            tcpSettings: {}
        },
        mux: {
            enabled: false,
            concurrency: -1
        }
      };

    case 'trojan':
      return {
        tag: "proxy",
        protocol: config.protocol,
        settings: {
          servers: [
            {
              address: config.add,
              port: config.port,
              password: config.uuid,
              email: "user@example.com"
            }
          ]
        },
        streamSettings: {
            network: config.net || "tcp",
            tcpSettings: {
                header: {
                  type: config.type || "none"
                }
            },
            security: config.scy || "none"
        },
        mux: {
            enabled: false,
            concurrency: -1
        }
      };

    case 'vmess':
      return {
        tag: "proxy",
        protocol: "vmess",
        settings: {
          vnext: [
            {
              address: config.add,
              port: config.port,
              users: [
                {
                  id: config.uuid,
                  security: config.scy || "none",
                  email: "user@example.com",
                  alterId: parseInt(config.aid, 10)
                }
              ]
            }
          ]
        },
        streamSettings: {
          network: config.net || "tcp",
          tcpSettings: {
            header: {
              type: config.type || "none"
            }
          }
        },
        mux: {
            enabled: false,
            concurrency: -1
        }
      };

    case 'vless':
      return {
        tag: "proxy",
        protocol: config.protocol,
        settings: {
          vnext: [
            {
              address: config.add,
              port: config.port,
              users: [
                {
                    id: config.uuid,
                    encryption: "none",
                    email: "user@example.com"
                }
              ]
            }
          ]
        },
        streamSettings: {
          network: config.net || "tcp",
          security: config.scy || "none",
          tcpSettings: {
            header: {
              type: config.type || "none"
            }
          }
        }
      };
    default:
      throw new Error("Unsupported Configuration");
  }
};

function checkOutbounds(removeOutbound) {
  // Check if the config file exists
  if (!fs.existsSync(configFilePath)) {
      throw new Error('Config file does not exist.');
  }

  // Read the file contents
  const fileContents = fs.readFileSync(configFilePath, 'utf-8');

  // Parse the JSON data
  const config = JSON.parse(fileContents);

  if(config.outbounds.length === 0) {
  
    throw new Error("Server Configuration is Empty")

  }

  if(removeOutbound) {
    config.outbounds = []
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf-8');
  }

}

function processConfig(config) {

  const outbound = createOutbound(config);
  configTemplate.outbounds = [outbound]
  fs.writeFileSync(configFilePath, JSON.stringify(configTemplate, null, 2), 'utf-8');

}

export {
  decodeSSLink,
  decodeTrolessLink,
  decodeVmessLink,
  processConfig,
  checkOutbounds
}
