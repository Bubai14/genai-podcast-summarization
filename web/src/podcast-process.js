import React, { useState, useEffect, useCallback, useContext } from 'react';
import { FileNameContext } from "./App";
import { useWebSocket } from 'react-use-websocket';

const WebSocketComponent = () => {
  const [socket, setSocket] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [wsurl, setWsurl] = useState('');
  const { filename } = useContext(FileNameContext);

  const connectWebSocket = useCallback(() => {
    if (socket) {
      socket.close(); 
    }

    const newSocket = new WebSocket(wsurl);

    newSocket.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
    };

    newSocket.onmessage = (event) => {
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setSocket(newSocket);
  }, [socket]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const handleConnect = () => {
    connectWebSocket();
  };

  const handleDisconnect = () => {
    if (socket) {
      socket.close();
    }
  };

  const handleInputChange = (event) => {
    setInputMessage(event.target.value);
  };

  const handleWSUrlInputChange = (event) => {
    setWsurl(event.target.value);
  };

  const handleSendMessage = () => {
    if (socket && isConnected && inputMessage.trim() !== '') {
      console.log('file:'+filename);
      console.log('inputMessage:'+inputMessage);
      socket.send(JSON.stringify({"action": "summarize", "prompt": inputMessage, "file": filename}));
      setInputMessage('');
    }
  };

  return (
    <div>
        <div class="mb-3">
          <label for="wsurl" class="form-label">WebSocket URL</label>
          <input type="text" class="form-control" value={wsurl}
              onChange={handleWSUrlInputChange} id="wsurl" aria-describedby="emailHelp"/>
        </div>
        <button class="btn btn-success" onClick={handleConnect} disabled={isConnected}>
              Connect
          </button>
        <div class="mb-3">
          <label for="validationCustom01" class="form-label">Prompt</label>
          <input
            id="validationCustom01"
            class="form-control"
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            disabled={!isConnected}
          />
        </div>  
        <div class="input-group mb-3">
          <div class="row">
            <div class="col">
              <button class="btn btn-primary" onClick={handleSendMessage} disabled={!isConnected}>
                Send
              </button>
            </div>
            <div class="col">
              <button class="btn btn-warning" onClick={handleDisconnect} disabled={!isConnected}>
                Disconnect
              </button>
            </div>
          </div>
        </div>
      <div>
        <h3>Messages:</h3>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WebSocketComponent;
