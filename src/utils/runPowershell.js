import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const configFilePath = path.resolve('./src/config.json')

function extractInbound() {

    let http;
    let socks;

    // Check if the config file exists
    if (!fs.existsSync(configFilePath)) {
        throw new Error('Config file does not exist.');
    }

    // Read the file contents
    const fileContents = fs.readFileSync(configFilePath, 'utf-8');

    // Parse the JSON data
    const config = JSON.parse(fileContents);

    // Extract the inbounds
    const inbounds = config.inbounds;

    inbounds.forEach(inbound => {
        switch (inbound.protocol) {
            
            case 'http':
                http = inbound
                break;
            case 'socks':
                socks = inbound
                break;
            default:
                throw new Error('Inbound property is missing from the config file.');
        }
    });

    if(http) {
        return http
    }

    return socks

}

function startProxySettings(){

    const inbound = extractInbound()
    const address = inbound.listen
    const port = inbound.port

    //spawn powershell process
    const ps = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-Command', '-']);
    const commands = [
        `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyServer -Value "${address}:${port}"`,
        `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyEnable -Value 1`,
        ];
    //write command to powershell
    commands.forEach((command) => {
        ps.stdin.write(`${command}\n`);
    })

    ps.stdin.end();

}

function stopProxySettings(){

    const inbound = extractInbound()
    const address = inbound.listen
    const port = inbound.port

    //spawn powershell process
    const ps = spawn('powershell.exe', ['-NoLogo', '-NoProfile', '-Command', '-']);
    const commands = [
        `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyServer -Value "${address}:${port}"`,
        `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings' -Name ProxyEnable -Value 0`,
        ];
    //write command to powershell
    commands.forEach((command) => {
        ps.stdin.write(`${command}\n`);
    })

    ps.stdin.end();

}

export {
    startProxySettings,
    stopProxySettings
}
