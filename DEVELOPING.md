# Developing

## Yarn Setup

This project uses yarn classic (v1.x)

You can install yarn a couple of ways:

... via npm:
```
npm install --global yarn
```

... via HomeBrew:
```
brew install yarn
```

Use yarn classic
```
yarn set version classic
```

Verify your version is v1.x
```
yarn --version
```


## Install

Pull in dependencies in your local project

```
yarn install 
```

## Build

Build and compile

```
yarn build
```

## Run Tests

Run the jest unit tests

```
yarn test
```

## Package

Manually package into a .vsix file output in the project root directory

```
yarn vscode:package
```

## Add Visual Studio Code to PATH

Make VS Code accessible via command line locally.

1. Open the Command Palette (Cmd+Shift+P)
2. Select "Shell Command - Install 'code' command in PATH"

## Install/Reinstall the Extension

All-in-one command to package, uninstall any existing extension, and install the new version to your VS Code.

```
yarn vscode:local-reinstall
```

Then either restart your VS Code or reload the window:
1. Open the Command Palette (Cmd+Shift+P)
2. Select "Developer: Reload Window"   

## Manually Install in Visual Studio Code

You may need to manually install the the packaged .vsix file into your local editor.

There are two ways to do this:

### Visual Studio Code UI:

1. Open the Extensions sidebar (Cmd+Shift+X)                                                         
2. Click the ··· menu                                                  
3. Select "Install from VSIX..."                          
4. Select the packaged .vsix file
5. Open the Command Palette (Cmd+Shift+P)
6. Select "Developer: Reload Window"   
                                                                                                    
### Command line:    

```
code --install-extension {.VSIX_FILE_NAME}            
```

## Debugging and Viewing Logs

1. Open the Command Palette (Cmd+Shift+P)
2. Select "Developer: Show Logs..."
3. Select "Extension Host"

## Manually Uninstall in Visual Studio Code

You may need to manually uninstall the extension if there are version downgrades or other issues locally.

There are two ways to do this:

### Visual Studio Code UI:

1. Open the Extensions sidebar (Cmd+Shift+X)  
2. Under the "Installed" section, find the "Salesforce Metadata Enrichment" extension
3. Click on it and press the Uninstall button
4. Restart VS Code

### Command Line:

```
code --uninstall-extension salesforce.salesforce-metadata-enrichment
```
