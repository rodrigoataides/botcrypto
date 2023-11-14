import React, { useRef, useState } from "react";
import "./App.css";
import axios from "axios";
import CryptoJS from "crypto-js";
import { time } from "console";

function App() {
  const symbols = [
    { value: "", label: "Escolha uma moeda" },
    { value: "BTCUSDT", label: "BitCoin" },
    { value: "ETHUSDT", label: "Ethereum" },
    { value: "BNBUSDT", label: "Binance" },
    { value: "INJUSDT", label: "Injective" },
  ];
  const strategyCombo = [
    { value: "", label: "Escolha um estrategia" },
    { value: "PRICE", label: "Preço definido" },
    { value: "SMA", label: "Média Móvel" },
    { value: "EMA", label: "Exponencial Móvel" },
  ];
  const [trade, setTrade] = useState([]);
  const [symbol, setSymbol] = useState("");
  const [strategy, setStrategy] = useState("");
  const [buyPrice, setBuyPrice] = useState("0.0");
  const [sellPrice, setSellPrice] = useState("0.0");
  const [priceCurrent, selPriceCurrent] = useState("0.00");
  const [quantity, setQuantity] = useState("0.001");
  const [apiKey, setApiKey] = useState(
    "bGGhPSsx9ZzgnnS2ZYclBsVjW1l7raAmnoN7VDZ3XWhOK2qC2Ttr7djpoyJVxmEm"
  ); //aprenda a criar as chaves: https://www.youtube.com/watch?v=-6bF6a6ecIs
  const [secretKey, setSecretKey] = useState(
    "qAK1ZuQ2gS4XMao6psqG0NsPmsjinyFnW9M8NtmjYDtVBwoCHb2fDu6gWkTUBB5p"
  );
  const [isOpened, setIsOpened] = useState(false);
  const api = "https://testnet.binance.vision"; //URL REAL https://api/binance.com
  const [timerRequest, setTimerRequest] = useState("5000");

  const intervalRef: any = useRef();

  /*
   * Funções
   */
  const startTrade = async () => {
    if (symbol !== "") {
      const { data } = await axios.get(
        `${api}/api/v3/klines?limit=21&interval=15m&symbol=${symbol}`
      );
      let logTrade: any = trade;
      let status = {};
      //pegando a última vela
      const candle = data.pop();
      //do array retornado pegamos a possição 4 que é o valor de fechamento
      const price = parseInt(candle[4]);
      selPriceCurrent(price.toString());
      const sma: number = calcSMA(data);
      const timestamp = Date.now();
      const time = new Date(timestamp).toLocaleString("pt-BR");
      const priceBuy = parseFloat((sma * 0.98).toString());
      const priceSell = parseFloat((sma * 1.02).toString());

      console.log(
        "Valor Moeda: " +
          price +
          " | Valor Buy: " +
          priceBuy +
          " | Valor Sell: " +
          priceSell
      );

      if (strategy === "PRICE") {
        if (price <= parseFloat(buyPrice) && !isOpened) {
          //faça a ordem
          const order = newOrder("BUY");
          status = {
            order: logTrade.length + 1,
            status: `Compra Efetuada`,
            valor: `$${price.toFixed(4)}`,
            sma: `$${(sma * 0.95).toFixed(4)}`,
            time: `${time}`,
            direction: "BUY",
          };
          //isOpened para true
          setIsOpened(true);
        } else if (price >= parseFloat(sellPrice) && isOpened) {
          //faça a ordem
          const order = newOrder("SELL");
          status = {
            order: logTrade.length + 1,
            status: `Venda Efetuada`,
            valor: `$${price.toFixed(4)}`,
            sma: `$${(sma * 1.05).toFixed(4)}`,
            time: `${time}`,
            direction: "SELL",
          };
          //isOpened para true
          setIsOpened(false);
        } else {
          console.log(price + " > " + priceBuy + " / Opened: " + isOpened);
          console.log(price + " > " + priceSell + " / Opened: " + isOpened);
          const situacao = isOpened ? "Comprado" : "";
          status = {
            order: logTrade.length + 1,
            status: `Aguardando`,
            valor: `$${price.toFixed(4)}`,
            sma: `$${sma.toFixed(4)}`,
            time: `${time}`,
            direction: "AWAIT",
          };
        }
      } else if (strategy === "SMA") {
        if (price <= priceBuy) {
          if (isOpened === false) {
            console.log(`${time} - Compra realizada`);
            //faça a ordem
            const order = newOrder("BUY");
            status = {
              order: logTrade.length + 1,
              status: `Compra Efetuada`,
              valor: `$${price.toFixed(4)}`,
              sma: `$${(sma * 0.95).toFixed(4)}`,
              time: `${time}`,
              direction: "BUY",
            };
            //isOpened para true
            setIsOpened(true);
          }
        } else if (price >= priceSell) {
          if (isOpened == true) {
            //faça a ordem
            const order = newOrder("SELL");
            status = {
              order: logTrade.length + 1,
              status: `Venda Efetuada`,
              valor: `$${price.toFixed(4)}`,
              sma: `$${(sma * 1.05).toFixed(4)}`,
              time: `${time}`,
              direction: "SELL",
            };
            //isOpened para true
            setIsOpened(false);
          }
        } else {
          console.log(price + " > " + priceBuy + " / Opened: " + isOpened);
          console.log(price + " > " + priceSell + " / Opened: " + isOpened);
          const situacao = isOpened ? "Comprado" : "";
          status = {
            order: logTrade.length + 1,
            status: `Aguardando`,
            valor: `$${price.toFixed(4)}`,
            sma: `$${sma.toFixed(4)}`,
            time: `${time}`,
            direction: "AWAIT",
          };
        }
      } else {
        alert("Não identifiquei a sua estratégia!");
      }

      logTrade.unshift(status);
      setTrade(logTrade);
      const interval = setTimeout(startTrade, parseFloat(timerRequest));
      intervalRef.current = interval;
    } else {
      alert("Você deve escolher uma moeda primeiro!");
    }
  };

  const calcSMA = (candles: []) => {
    const closes = candles.map((c) => parseFloat(c[4]));
    const sum: number = closes.reduce((a, b) => a + b);
    return sum / closes.length;
  };

  const stopTrade = () => {
    clearInterval(intervalRef.current);
    setTrade([]);
  };

  const newOrder = async (side: string) => {
    if (apiKey !== "" && secretKey !== "") {
      const timestamp = Date.now();
      const order: any = {
        symbol,
        quantity,
        side,
        type: "Market",
        timestamp: timestamp,
      };

      const queryString = new URLSearchParams(order).toString();

      const signature = CryptoJS.HmacSHA256(queryString, secretKey).toString(
        CryptoJS.enc.Hex
      );

      order.signature = signature;
      try {
        const { data } = await axios.post(
          `${api}/api/v3/order`,
          new URLSearchParams(order).toString(),
          { headers: { "X-MBX-APIKEY": apiKey } }
        );
        return data;
      } catch (err: any) {
        return err.response.data;
      }
    } else {
      alert("Falta ou API_KEY ou SECRET_KEY");
    }
  };

  return (
    <>
      <header
        style={{
          width: "99vw",
          backgroundColor: "#020202",
          color: "#fff",
          padding: 10,
          display: "flex",
          justifyItems: "center",
        }}
      >
        Sistema de Bot para Crypto Moedas
      </header>
      <main style={{ width: "99vw" }}>
        <div className='container'>
          <div style={{ width: "99%", height: "40px" }}>
            <div>
              <h2>Trade</h2>
            </div>
          </div>
          <hr style={{ width: "90%" }}></hr>
          <div style={{ display: "flex" }}>
            <div
              style={{
                width: "20vw",
                borderRight: "1px dashed #000",
                display: "flex",
                flexDirection: "column",
                padding: 10,
                height: "95%",
              }}
            >
              <h3>Parâmetro para o Trade</h3>
              <div
                style={{
                  width: "10vw",
                  borderBottom: "1px dashed silver",
                  padding: 5,
                }}
              >
                <label>Moeda</label>
                <select onChange={(e) => setSymbol(e.target.value)}>
                  {symbols.map((symbol) => {
                    return <option value={symbol.value}>{symbol.label}</option>;
                  })}
                </select>
                <br />
                {priceCurrent != "0.00"
                  ? `Preço atual é : $${priceCurrent}`
                  : "Selecione uma moeda!"}
              </div>
              <div
                style={{
                  width: "10vw",
                  borderBottom: "1px dashed silver",
                  padding: 5,
                }}
              >
                <label>Estratégia</label>
                <select onChange={(e) => setStrategy(e.target.value)}>
                  {strategyCombo.map((strategy) => {
                    return (
                      <option value={strategy.value}>{strategy.label}</option>
                    );
                  })}
                </select>
                <br />
                {priceCurrent != "0.00"
                  ? `Preço atual é : $${priceCurrent}`
                  : "Selecione uma moeda!"}
              </div>
              <div
                style={{
                  width: "10vw",
                  borderBottom: "1px dashed silver",
                  padding: 5,
                }}
              >
                <label>Preço de Compra</label>
                <input
                  type='number'
                  value={buyPrice}
                  onInput={(e) =>
                    setBuyPrice((e.target as HTMLInputElement).value)
                  }
                />
              </div>
              <div
                style={{
                  width: "10vw",
                  borderBottom: "1px dashed silver",
                  padding: 5,
                }}
              >
                <label>Preço de Venda</label>
                <input
                  type='number'
                  value={sellPrice}
                  onInput={(e) =>
                    setSellPrice((e.target as HTMLInputElement).value)
                  }
                />
              </div>
              <div
                style={{
                  width: "10vw",
                  borderBottom: "1px dashed silver",
                  padding: 5,
                }}
              >
                <label>Quantidade de modeda</label>
                <input
                  type='number'
                  value={quantity}
                  onInput={(e) =>
                    setQuantity((e.target as HTMLInputElement).value)
                  }
                />
              </div>
              <div
                style={{
                  width: "10vw",
                  borderBottom: "1px dashed silver",
                  padding: 5,
                }}
              >
                <label>API KEY</label>
                <input
                  type='text'
                  value={apiKey}
                  onInput={(e) =>
                    setApiKey((e.target as HTMLInputElement).value)
                  }
                />
              </div>
              <div
                style={{
                  width: "10vw",
                  borderBottom: "1px dashed silver",
                  padding: 5,
                }}
              >
                <label>SECRET KEY</label>
                <input
                  type='password'
                  value={secretKey}
                  onInput={(e) =>
                    setSecretKey((e.target as HTMLInputElement).value)
                  }
                />
              </div>
              <div
                style={{
                  width: "10vw",
                  borderBottom: "1px dashed silver",
                  padding: 5,
                }}
              >
                <label style={{ width: "100%" }}>
                  Timer Request (milliseconds)
                </label>
                <input
                  type='number'
                  value={timerRequest}
                  onInput={(e) =>
                    setTimerRequest((e.target as HTMLInputElement).value)
                  }
                  min={5000}
                  max={60000}
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ width: "10vw", paddingTop: 10 }}>
                <button onClick={(e) => startTrade()}>Start Trade</button>&nbsp;
                <button onClick={(e) => stopTrade()}>Stop Trade</button>
              </div>
            </div>
            <div
              style={{
                width: "20vw",
                display: "flex",
                flexDirection: "column",
                padding: 10,
                height: "95%",
                borderRight: "1px dashed #000",
              }}
            >
              <h3>Ordem executada</h3>
            </div>
            <div
              style={{
                width: "55vw",
                padding: 10,
              }}
            >
              <div style={{ width: "99%" }}>
                <div style={{ width: "99%", textAlign: "center" }}>
                  <h3>Log Trade</h3>
                </div>
                <div
                  style={{
                    width: "95%",
                    height: "70vh",
                    textAlign: "center",
                    backgroundColor: "#F9F9F9",
                    borderRadius: 5,
                    boxShadow: "5px 6px 5px gray",
                    border: "1px solid gray",
                  }}
                >
                  <div
                    style={{
                      width: "98%",
                      padding: 5,
                      borderBottom: "1px dashed silver",
                      display: "flex",
                    }}
                  >
                    <div style={{ width: "5%" }}>Ordem</div>
                    <div style={{ width: "35%" }}>Status</div>
                    <div style={{ width: "20%" }}>Valor</div>
                    <div style={{ width: "20%" }}>
                      SMA {isOpened ? "Venda" : "Compra"}
                    </div>
                    <div style={{ width: "20%" }}>Time</div>
                  </div>
                  <div
                    style={{
                      width: "99%",
                      display: "grid",
                      overflowY: "scroll",
                      height: "90%",
                    }}
                  >
                    {trade.map((item: any) => {
                      return (
                        <div
                          style={{
                            width: "100%",
                            padding: 5,
                            border: "1px dashed silver",
                            display: "flex",
                            backgroundColor:
                              item.direction === "AWAIT"
                                ? "#F9FF80"
                                : item.direction == "BUY"
                                ? "#8DFF80"
                                : "#FF9780",
                          }}
                        >
                          <div style={{ width: "5%" }}>{item.order}</div>
                          <div style={{ width: "35%" }}>{item.status}</div>
                          <div
                            style={{
                              width: "20%",
                            }}
                          >
                            {item.valor}
                          </div>
                          <div
                            style={{
                              width: "20%",
                            }}
                          >
                            {item.sma}
                          </div>
                          <div style={{ width: "20%" }}>{item.time}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
