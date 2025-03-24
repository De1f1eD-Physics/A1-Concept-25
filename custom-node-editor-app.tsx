import React, { useState, useRef, useEffect } from 'react';

const NodeEditor = () => {
  const [isMac, setIsMac] = useState(true);
  const [iframeCode, setIframeCode] = useState('');
  const [isEditMode, setIsEditMode] = useState(true);
  const [websiteUrl, setWebsiteUrl] = useState('https://adb-inspector.corp.apple.com');
  
  // For the simplified drag-and-drop functionality
  const [nodes, setNodes] = useState([
    { id: 'website', type: 'website', left: 20, top: 80, width: 500, height: 320, zIndex: 1 },
    { id: 'terminal', type: 'terminal', left: 540, top: 80, width: 320, height: 320, zIndex: 2 },
    { id: 'iframe', type: 'iframe', left: 20, top: 420, width: 840, height: 200, zIndex: 3 }
  ]);
  
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [terminalOutput, setTerminalOutput] = useState([
    { id: 1, text: 'Terminal initialized. Type a command and press Enter.' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [currentId, setCurrentId] = useState(2);
  const editorRef = useRef(null);

  // Handle node dragging
  const handleMouseDown = (e, nodeId) => {
    if (!isEditMode) return;
    
    const node = nodes.find(n => n.id === nodeId);
    setDraggedNode(nodeId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!draggedNode || !isEditMode) return;
    
    const editorRect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - editorRect.left - dragOffset.x;
    const y = e.clientY - editorRect.top - dragOffset.y;
    
    setNodes(nodes.map(node => {
      if (node.id === draggedNode) {
        return { ...node, left: x, top: y };
      }
      return node;
    }));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  useEffect(() => {
    if (isEditMode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isEditMode, draggedNode]);

  // Terminal functionality
  const handleTerminalInput = (e) => {
    setTerminalInput(e.target.value);
  };

  const handleTerminalSubmit = (e) => {
    e.preventDefault();
    if (terminalInput.trim() === '') return;
    
    const newOutput = [...terminalOutput, { 
      id: currentId, 
      text: `${isMac ? '$ ' : '> '}${terminalInput}`,
      isCommand: true
    }];
    
    newOutput.push({
      id: currentId + 1,
      text: `Command "${terminalInput}" was received.`
    });
    
    setTerminalOutput(newOutput);
    setCurrentId(currentId + 2);
    setTerminalInput('');
  };

  // Render nodes based on type
  const renderNode = (node) => {
    const nodeStyle = {
      position: 'absolute',
      left: `${node.left}px`,
      top: `${node.top}px`,
      width: `${node.width}px`,
      height: `${node.height}px`,
      zIndex: node.zIndex,
      cursor: isEditMode ? 'move' : 'default'
    };

    switch (node.type) {
      case 'website':
        return (
          <div
            key={node.id}
            style={nodeStyle}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-300"
          >
            <div className="bg-gray-200 p-2 flex justify-between items-center">
              <h2 className="font-semibold">Website</h2>
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="bg-white p-4 overflow-hidden" style={{ height: 'calc(100% - 40px)' }}>
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                <p className="text-gray-500">Website would load here: {websiteUrl}</p>
                <p className="text-sm text-gray-400 ml-2">In production: iframe or embedded web view</p>
              </div>
            </div>
          </div>
        );
      
      case 'terminal':
        return (
          <div
            key={node.id}
            style={nodeStyle}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            className="bg-black rounded-lg shadow-lg overflow-hidden border-2 border-gray-700"
          >
            <div className="bg-gray-800 p-2 flex justify-between items-center">
              <h2 className="font-semibold text-white">
                {isMac ? 'Terminal (macOS)' : 'PowerShell (Windows)'}
              </h2>
              <button 
                onClick={() => setIsMac(!isMac)} 
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Switch to {isMac ? 'PowerShell' : 'Terminal'}
              </button>
            </div>
            <div 
              className="bg-black p-2 text-green-400 font-mono text-sm overflow-y-auto"
              style={{ height: 'calc(100% - 80px)' }}
            >
              {terminalOutput.map(line => (
                <div key={line.id} className={line.isCommand ? 'text-white' : 'text-green-400'}>
                  {line.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleTerminalSubmit} className="p-2 border-t border-gray-700">
              <div className="flex items-center">
                <span className="text-green-400 mr-2">{isMac ? '$' : '>'}</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={handleTerminalInput}
                  className="flex-1 bg-black text-white font-mono focus:outline-none"
                  placeholder="Type command here..."
                />
              </div>
            </form>
          </div>
        );
      
      case 'iframe':
        return (
          <div
            key={node.id}
            style={nodeStyle}
            onMouseDown={(e) => handleMouseDown(e, node.id)}
            className="bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-300"
          >
            <div className="bg-gray-200 p-2 flex justify-between items-center">
              <h2 className="font-semibold">Iframe Content</h2>
              {isEditMode && (
                <input
                  type="text"
                  value={iframeCode}
                  onChange={(e) => setIframeCode(e.target.value)}
                  className="ml-2 px-2 py-1 border rounded text-sm flex-1"
                  placeholder="<iframe src='...'></iframe>"
                />
              )}
            </div>
            <div 
              className="bg-gray-100 p-4" 
              style={{ height: 'calc(100% - 40px)' }}
            >
              {iframeCode ? (
                <div dangerouslySetInnerHTML={{ __html: iframeCode }} className="w-full h-full" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">
                    {isEditMode ? 'Enter iframe code above' : 'No iframe code specified'}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render application in view mode
  const renderApplication = () => {
    return (
      <div className="flex flex-col h-full bg-gray-100">
        <div className="p-4 bg-gray-800 text-white">
          <h1 className="text-xl font-bold">Terminal & Website Viewer</h1>
        </div>
        
        <div className="flex flex-1 p-4 gap-4 overflow-hidden">
          {/* Website Panel - Left side */}
          <div className="w-2/3 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="bg-gray-200 p-2 flex justify-between items-center">
              <h2 className="font-semibold">Website</h2>
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
            </div>
            <div className="flex-1 bg-white p-4 overflow-hidden">
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                <p className="text-gray-500">Website would load here: {websiteUrl}</p>
              </div>
            </div>
          </div>
          
          {/* Terminal Panel - Right side */}
          <div className="w-1/3 bg-black rounded-lg shadow-lg overflow-hidden flex flex-col">
            <div className="bg-gray-800 p-2 flex justify-between items-center">
              <h2 className="font-semibold text-white">
                {isMac ? 'Terminal (macOS)' : 'PowerShell (Windows)'}
              </h2>
              <button 
                onClick={() => setIsMac(!isMac)} 
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Switch to {isMac ? 'PowerShell' : 'Terminal'}
              </button>
            </div>
            <div className="flex-1 bg-black p-2 text-green-400 font-mono text-sm overflow-y-auto">
              {terminalOutput.map(line => (
                <div key={line.id} className={line.isCommand ? 'text-white' : 'text-green-400'}>
                  {line.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleTerminalSubmit} className="p-2 border-t border-gray-700">
              <div className="flex items-center">
                <span className="text-green-400 mr-2">{isMac ? '$' : '>'}</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={handleTerminalInput}
                  className="flex-1 bg-black text-white font-mono focus:outline-none"
                  placeholder="Type command here..."
                />
              </div>
            </form>
          </div>
        </div>
        
        {/* Iframe area at the bottom */}
        <div className="p-4">
          <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gray-200 p-2">
              <h2 className="font-semibold">Iframe Content</h2>
            </div>
            <div className="h-48 bg-gray-100 p-4">
              {iframeCode ? (
                <div dangerouslySetInnerHTML={{ __html: iframeCode }} className="w-full h-full" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No iframe code specified</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">WYSIWYG Node Editor</h1>
        <div className="flex space-x-4 items-center">
          <div>
            <label className="text-sm mr-2">Website URL:</label>
            <input 
              type="text" 
              value={websiteUrl} 
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded w-64"
            />
          </div>
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isEditMode ? 'View Mode' : 'Edit Mode'}
          </button>
        </div>
      </div>
      
      {isEditMode ? (
        <div className="flex-1 relative bg-gray-100 overflow-hidden" ref={editorRef}>
          <div className="absolute top-0 left-0 right-0 bg-gray-200 p-2 z-10">
            <p className="text-gray-600 text-sm">
              <span className="font-bold">Editor Mode:</span> Drag components to reposition them
            </p>
          </div>
          {nodes.map(renderNode)}
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {renderApplication()}
        </div>
      )}
    </div>
  );
};

export default NodeEditor;
