# Developing

## Install

Pull in dependencies in your local project

```
yarn install 
```

## Build:

Build and compile

```
yarn build
```

## Run Tests:

Run the jest unit tests

```
yarn test
```

## Package

Package into a .vsix file output in the project root directory

```
yarn vscode:package
```

## Install in Visual Studio Code

Install the packaged .vsix file into your local editor.

There are two ways to do this:

### Visual Studio Code UI:                                                                               
1. Open the Extensions sidebar (Cmd+Shift+X)                                                         
2. Click the ··· menu                                                  
3. Select "Install from VSIX..."                          
4. Select the packaged .vsix file
5. Reload the editor (Cmd+Shift+P)                
                                                                                                    
### Command line:      

```
code --install-extension {.VSIX_FILE_NAME}            
```
