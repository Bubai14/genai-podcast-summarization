import logo from './logo.svg';
import './App.css';
import { React, useState, createContext } from "react";
import S3FileUpload from './podcast-form';
import WebSocketComponent from './podcast-process';
import 'bootstrap/dist/css/bootstrap.min.css';

// Create a new context and export
export const FileNameContext = createContext();

// Create a Context Provider
const FileNameContextProvider = ({ children }) => {
    const [filename, setFilename] = useState(undefined);

    return (
        <FileNameContext.Provider value={{ filename, setFilename }}>
            {children}
        </FileNameContext.Provider>
    );
};

function App() {
  return (
    <div className="container">
          <header>
            <h2>
              Podcast Summarizer
            </h2>
          </header>
          <FileNameContextProvider>
          <div>
            <div class="row">
              <div class="col">
                <span class="">
                  <S3FileUpload />
                </span>  
              </div>
            </div>
            <br></br>
            <div class="row">
              <div class="col">
                <span class="">
                  <WebSocketComponent />
                </span>
              </div>
            </div>
          </div>
          </FileNameContextProvider>
    </div>
  );
}

export default App;
