import WS from "../websocket";

describe("The WS helper", () => {
  afterEach(() => {
    WS.clean();
  });

  it("keeps track of received messages", async () => {
    const server = new WS("ws://localhost:1234");
    const client = new WebSocket("ws://localhost:1234");

    await server.connected;
    client.send("hello");
    await server.nextMessage;
    expect(server.messages).toEqual(["hello"]);
  });

  it("cleans up connected clients and messages on 'clean'", async () => {
    const server = new WS("ws://localhost:1234");
    const client1 = new WebSocket("ws://localhost:1234");
    await server.connected;
    const client2 = new WebSocket("ws://localhost:1234");
    await server.connected;
    client1.send("hello 1");
    await server.nextMessage;
    client2.send("hello 2");
    await server.nextMessage;
    expect(server.messages).toEqual(["hello 1", "hello 2"]);

    WS.clean();
    expect(WS.instances).toEqual([]);
    expect(server.messages).toEqual([]);
  });

  it("sends messages to connected clients", async () => {
    const server = new WS("ws://localhost:1234");
    const client1 = new WebSocket("ws://localhost:1234");
    await server.connected;
    const client2 = new WebSocket("ws://localhost:1234");
    await server.connected;

    const messages = { client1: [], client2: [] };
    client1.onmessage = e => {
      messages.client1.push(e.data);
    };
    client2.onmessage = e => {
      messages.client2.push(e.data);
    };

    server.send("hello everyone");
    expect(messages).toEqual({
      client1: ["hello everyone"],
      client2: ["hello everyone"],
    });
  });

  it("closes the connection", async () => {
    const server = new WS("ws://localhost:1234");
    const client = new WebSocket("ws://localhost:1234");
    await server.connected;

    let disconnected = false;
    client.onclose = () => {
      disconnected = true;
    };

    server.send("hello everyone");
    server.close();
    expect(disconnected).toBe(true);
  });

  it("sends errors to connected clients", async () => {
    const server = new WS("ws://localhost:1234");
    const client = new WebSocket("ws://localhost:1234");
    await server.connected;

    let disconnected = false;
    let error = null;
    client.onclose = () => {
      disconnected = true;
    };
    client.onerror = e => {
      error = e;
    };

    server.send("hello everyone");
    server.error();
    expect(disconnected).toBe(true);
    expect(error.origin).toBe("ws://localhost:1234/");
    expect(error.type).toBe("error");
  });
});