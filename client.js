const net = require("net");

const client = net.createConnection({ port: 80 }, () =>
{

});

process.stdin.on("data", (str) =>
{
    let input = str.toString().trim();
    if (input == "STOP")
    {
        client.write(input);
        console.log("Leaving...");
        client.end();
        process.exit();
    }
    else
    {
        client.write(input);
    }
})

client.on("data", (data) =>
{
    console.log(data.toString().trim());
})