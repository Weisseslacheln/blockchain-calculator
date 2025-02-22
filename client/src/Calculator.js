import React, { useState, useEffect, useRef } from "react";
import Button from "./Button";
import axios from "axios";

const Calculator = () => {
  const [input, setInput] = useState("0");
  const inputRef = useRef(null);
  const historyRef = useRef(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    fetchHistory();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [history]);

  const fetchHistory = async () => {
    const response = await axios.get("http://localhost:3001/history");
    setHistory(response.data);
  };

  const handleClick = async (value) => {
    if (input === "Error") {
      value === "CE" || value === "⬅︎" ? setInput("0") : setInput(value);
    } else if (value === "=") {
      try {
        const response = await axios.post("http://localhost:3001/calculate", {
          expr: input,
        });
        setInput(response.data.result.toString());
        fetchHistory();
      } catch (error) {
        setInput("Error");
      }
    } else if (value === "CE") {
      setInput("0");
    } else if (value === "⬅︎") {
      input === "0"
        ? setInput(input)
        : input.slice(0, -1) === "" || input.slice(0, -1) === "-"
        ? setInput("0")
        : setInput(input.slice(0, -1));
    } else if (
      ["/", "*", "-", "+", "0"].indexOf(input.slice(-1)) != -1 &&
      ["/", "*", "-", "+"].indexOf(value) != -1
    ) {
      input.slice(-1) === "0"
        ? setInput(input + value)
        : setInput(input.slice(0, -1) + value);
    } else if (input === "0") {
      setInput(value);
    } else {
      setInput(input + value);
    }
  };

  const handleInputChange = (event) => {
    setInput(event.target.value);
  };

  const handleKeyDown = (event) => {
    const { key } = event;

    if (/[\d+\-*/.=()]|Enter|Backspace/.test(key)) {
      if (key === "Enter" || key === "=") {
        event.preventDefault();
        handleClick("=");
      } else if (key === "Backspace") {
        event.preventDefault();
        handleClick("⬅︎");
      } else {
        event.preventDefault();
        handleClick(key);
      }
    } else {
      event.preventDefault();
    }
  };

  const moveCursorToEnd = () => {
    if (inputRef.current) {
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
      inputRef.current.focus();
    }
  };

  const clearHistory = async () => {
    await axios.post("http://localhost:3001/clear-history");
    setHistory([]);
  };

  return (
    <div className="calculator">
      <input
        type="text"
        className="display"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onClick={moveCursorToEnd}
        ref={inputRef}
      />
      <div className="buttons">
        <Button value="(" onClick={handleClick} />
        <Button value=")" onClick={handleClick} />
        <Button value="CE" onClick={handleClick} />
        <Button value="⬅︎" onClick={handleClick} />
        <Button value="7" onClick={handleClick} />
        <Button value="8" onClick={handleClick} />
        <Button value="9" onClick={handleClick} />
        <Button value="/" onClick={handleClick} />
        <Button value="4" onClick={handleClick} />
        <Button value="5" onClick={handleClick} />
        <Button value="6" onClick={handleClick} />
        <Button value="*" onClick={handleClick} />
        <Button value="1" onClick={handleClick} />
        <Button value="2" onClick={handleClick} />
        <Button value="3" onClick={handleClick} />
        <Button value="-" onClick={handleClick} />
        <Button value="0" onClick={handleClick} />
        <Button value="." onClick={handleClick} />
        <Button value="=" onClick={handleClick} />
        <Button value="+" onClick={handleClick} />
      </div>
      <div className="history-container">
        <button onClick={clearHistory}>Clear History</button>
        <div className="history" ref={historyRef}>
          <ul>
            {history.map((el, idx) => (
              <li key={idx}>{`${el[0]} = ${el[1] / 100} (${new Date(
                el[2] * 1000
              ).toLocaleString()})`}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
