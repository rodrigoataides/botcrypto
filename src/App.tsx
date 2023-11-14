import React, { useRef, useState } from "react";
import "./App.css";
import axios from "axios";
import CryptoJS from "crypto-js";
import { time } from "console";

function App() {
  const symbols = [
    { value: "", label: "Escolha uma moeda" },
    { value: "BTCUSDT", label: "BTCUSDT" },
  ];
  const [trade, setTrade] = useState([]);
  const [symbol, setSymbol] = useState("");
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
      const priceBuy = parseFloat((sma * 0.95).toString());
      const priceSell = parseFloat((sma * 1.05).toString());

      //if (price <= priceBuy) alert("Bora comprar meu povo.");
      //if (price >= priceBuy) alert("Bora vender meu povo.");

      if (price < priceBuy && !isOpened) {
        /*if (
          window.confirm("Apareceu uma oportunidade de compra, posso comprar?")
        ) {*/
        //faça a ordem
        const order = newOrder("BUY");
        console.log(price + "<" + priceBuy);
        status = {
          order: logTrade.length + 1,
          status: `Compra Efetuada`,
          valor: `$${price.toFixed(4)}`,
          sma: `$${(sma * 0.95).toFixed(4)}`,
          time: `${time}`,
        };
        //isOpened para true
        setIsOpened(true);
        /*} else {
          status = {
            order: logTrade.length + 1,
            status: `Opção de Compra Negada`,
            valor: `$${price.toFixed(4)}`,
            sma: `$${(sma * 0.95).toFixed(4)}`,
            time: `${time}`,
          };
        }*/
      } else if (price > priceSell && isOpened) {
        /*if (
          window.confirm("Apareceu uma oportunidade de venda, posso vender?")
        ) {*/
        //faça a ordem
        console.log(price + ">" + priceBuy);
        const order = newOrder("SELL");
        status = {
          order: logTrade.length + 1,
          status: `Venda Efetuada`,
          valor: `$${price.toFixed(4)}`,
          sma: `$${(sma * 1.05).toFixed(4)}`,
          time: `${time}`,
        };
        //isOpened para true
        setIsOpened(false);
        /*} else {
          status = {
            order: logTrade.length + 1,
            status: `Opção de Venda Cancelada`,
            valor: `$${price.toFixed(4)}`,
            sma: `$${(sma * 1.05).toFixed(4)}`,
            time: `${time}`,
          };
        }*/
      } else {
        console.log(price + ">" + priceBuy + " / Opened" + isOpened);
        const situacao = isOpened ? "Venda" : "Compra";
        status = {
          order: logTrade.length + 1,
          status: `Aguardando ${situacao}`,
          valor: `$${price.toFixed(4)}`,
          sma: `$${sma.toFixed(4)}`,
          time: `${time}`,
        };
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
          <div style={{ width: "100%", height: "40px" }}>
            <div>Trade</div>
          </div>
          <hr></hr>
          <div style={{ display: "flex" }}>
            <div style={{ width: "45vw" }}>
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
            <div style={{ width: "45vw" }}>
              <div style={{ width: "99%" }}>
                <div
                  style={{ width: "99%", textAlign: "center", padding: 2.5 }}
                >
                  <h3>Log Trade</h3>
                </div>
                <div
                  style={{
                    width: "99%",
                    height: "75vh",
                    textAlign: "center",
                    backgroundColor: "#f0f0f0",
                    borderRadius: 5,
                    boxShadow: "5px 6px 5px gray",
                    border: "1px solid gray",
                  }}
                >
                  <div
                    style={{
                      width: "95%",
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
                      width: "97%",
                      display: "grid",
                      overflowY: "scroll",
                      height: "95%",
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
                              item.valor < item.sma ? "#8DFF80" : "#FF9780",
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
