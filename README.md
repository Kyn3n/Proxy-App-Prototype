# Prototype Development for Windows
To run development for app:
```
npm install
npm run dev
```
To build app
```
npm run build
```

<!-- 1. npm create vite & select your desired variant
2. create ./src/ui directory & move all contents in ./src into ./src/ui 
3. in vite.config.js, add:
    ```
    "base": "./"
    build: {
        outDir: 'dist-react',
    },
    ```
    so that it creates a 'dist-react folder' to store .html files
4. npm install --save-dev electron to install electron
5. create a ./src/electron directory & add a main.js (w/ electron.js code) file inside 
6. in package.json, under "scripts"
    ```
    "dev":"npx concurrently \"vite\" \"cross-env NODE_ENV=development electron .\""
    ```
7. for building the app, create an electron-builder.json file under root dir, and enter
    ```
    {
        "appId": "your.package.name",
        "files": ["src", "dist-react"],
        "icon": "your-image-name",
        "mac": {
            "target": "dmg"
        },
        "linux": {
            "target": "AppImage",
            "category": "Utility"
        },
        "win": {
            "target": ["portable", "msi"]
        }
    }
    ```
8. in package.json, add .js in ur "main" dir, then under "scripts" add:
    ```
    "dist:mac": "npm run build && electron-builder --mac --arm64",
    "dist:win": "npm run build && electron-builder --win --x64",
    "dist:linux": "npm run build && electron-builder --linux --x64"
    ```
9. run cmd as admin, and run command "npm run dist:name" to build
10. to implement hot-module reloading for electron:
    - "npm i --save-dev cross-env"
    - go to package.json, edit "dev:electron" value to "cross-env NODE_ENV=development electron ."
    - create a "util.js" file in the ./src/electron dir w/:
        ```
        export function isDev() {
            return process.env.NODE_ENV === "development";
        }
        ```
    - add "server" config in vite.config.js file:
        ```
        server: {
            port: YOUR_PORT_NUMBER,
            strictPort: true
        }
        ```
    - add this block of code in your ./src/electron/main.js file
        ```
        if(isDev()) {
            mainWindow.loadURL('http://localhost:YOUR_PORT_NUMBER');
        } else {
            mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
        }
        ```
    - run both "dev:react" and "dev:electron" -->