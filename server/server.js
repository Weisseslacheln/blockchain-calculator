require("dotenv").config();
const express = require("express");
const Web3 = require("web3");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const web3 = new Web3(process.env.INFURA_URL);
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

const abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "int256",
        name: "num1",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "operator",
        type: "string",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "num2",
        type: "int256",
      },
      {
        indexed: false,
        internalType: "int256",
        name: "result",
        type: "int256",
      },
    ],
    name: "Calculated",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "int256",
        name: "num1",
        type: "int256",
      },
      {
        internalType: "string",
        name: "operator",
        type: "string",
      },
      {
        internalType: "int256",
        name: "num2",
        type: "int256",
      },
    ],
    name: "calculate",
    outputs: [
      {
        internalType: "int256",
        name: "",
        type: "int256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "clearHistory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "getHistory",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "input",
            type: "string",
          },
          {
            internalType: "int256",
            name: "result",
            type: "int256",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct Calculator.Operation[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "history",
    outputs: [
      {
        internalType: "string",
        name: "input",
        type: "string",
      },
      {
        internalType: "int256",
        name: "result",
        type: "int256",
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "input",
        type: "string",
      },
      {
        internalType: "int256",
        name: "result",
        type: "int256",
      },
    ],
    name: "setHistory",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);

const parseExpression = (expression) => {
  const output = [];
  const operators = [];
  let number = "";

  const precedence = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
  };

  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];

    if (/[0-9.]/.test(char)) {
      number += char;
    } else {
      if (number !== "") {
        output.push(number);
        number = "";
      }
      if (char in precedence) {
        while (
          operators.length > 0 &&
          operators[operators.length - 1] !== "(" &&
          precedence[operators[operators.length - 1]] >= precedence[char]
        ) {
          output.push(operators.pop());
        }
        operators.push(char);
      } else if (char === "(") {
        operators.push(char);
      } else if (char === ")") {
        while (
          operators.length > 0 &&
          operators[operators.length - 1] !== "("
        ) {
          output.push(operators.pop());
        }
        if (operators.length > 0 && operators[operators.length - 1] === "(") {
          operators.pop();
        } else {
          throw new Error("Несбалансированные скобки");
        }
      } else {
        throw new Error(`Неизвестный символ: ${char}`);
      }
    }
  }

  if (number !== "") {
    output.push(number);
  }

  while (operators.length > 0) {
    const op = operators.pop();
    if (op === "(") {
      throw new Error("Несбалансированные скобки");
    }
    output.push(op);
  }

  return output;
};

const evaluate = async (rpn) => {
  const stack = [];

  for (const token of rpn) {
    if (/^[0-9.]+$/.test(token)) {
      stack.push(parseFloat(token));
    } else {
      let [y, x] = [stack.pop(), stack.pop()];
      let answer = await contract.methods
        .calculate(parseFloat(x) * 100, token, parseFloat(y) * 100)
        .call({ from: account.address });
      token === "+" || token === "-"
        ? stack.push(answer / 100)
        : token === "*"
        ? stack.push(answer / 10000)
        : stack.push(answer);
    }
  }

  if (stack.length !== 1) {
    throw new Error("Ошибка в выражении");
  }

  return stack.pop();
};

app.post("/calculate", async (req, res) => {
  try {
    const { expr } = req.body;

    let result = await evaluate(parseExpression(expr));

    await contract.methods
      .setHistory(expr, parseFloat(result) * 100)
      .send({ from: account.address, gas: 300000 });

    res.json({ result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/history", async (req, res) => {
  try {
    const history = await contract.methods.getHistory().call();
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/clear-history", async (req, res) => {
  try {
    await contract.methods
      .clearHistory()
      .send({ from: account.address, gas: 300000 });
    res.json({ message: "History cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => console.log("Server running on port 3001"));
