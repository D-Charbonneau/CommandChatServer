const net = require("net");
const fs = require("fs");

let userID = 0;

let password = "supersecretpw";

let users = [];

const server = net.createServer((client) =>
{
    userID++; //Unique user id increments anytime a new user connects.
    users.push({ id: client, username: `Guest${userID}` }); //Adds user to userlist
    for (let i = 0; i < users.length; i++) //Sending connection message to all exisiting users
    {
        if (users[i].id != client)
        {
            users[i].id.write(`Guest${userID} has connected to the server!`);
        }
    }
    chatLog(`Guest${userID} has connected to the server!`);
    client.write(`-------------------------------------------\n\n\nWelcome!\n\nYou will be known as Guest${userID}.`);
    if (users.length == 1)
    {
        client.write(`\nYou are the admin. The current password is ${password}`);
    }

    client.on("error", (err) =>
    {
        if (err.message != "read ECONNRESET") //If the error is not due to a user disconnecting it will be logged and sent to console.
        {
            chatLog("ERROR: \n" + err.message);
        }
    });
    //When a client sends any data it goes here
    client.on("data", (data) =>
    {
        let input = data.toString().trim(); //Saves input to a string.
        for (let i = 0; i < users.length; i++) //Searching for the client in the clientlist (For access to username and such)
        {
            if (users[i].id == client) //Sender is found in clientlist
            {
                let args = input.split(" ");
                switch (args[0]) //Parsing and checking for commands before sending a message
                {
                    case "STOP":
                        chatLog(`User "${users[i].username}" used STOP`);
                        for (let j = 0; j < users.length; j++)
                        {
                            if (users[j].id != client)
                            {
                                users[j].id.write(`${users[i].username} has left!`);
                            }
                        }
                        chatLog(`${users[i].username} has left!`);
                        if (i == 0 && users.length > 1)
                        {
                            users[i + 1].id.write(`You are the admin. The current password is ${password}`);
                        }
                        users.splice(i, 1); //Removing user from userlist
                        break;
                    case "HELP":
                        chatLog(`User "${users[i].username}" used HELP`);
                        client.write("Commands: (Note: Commands are case-sensitive)\n\nHELP: Lists commands\nSTOP: Exits the process and terminates connection\nUSERNAME <username>: Changes username");
                        break;
                    case "USERNAME":
                        chatLog(`User "${users[i].username}" used USERNAME`);
                        if (args.length == 1)
                        {
                            client.write("Insufficient arguments: USERNAME <username>");
                        }
                        else
                        {
                            let guestCheck = /^Guest\d+/i; //Checks if the user is trying to take a name reserved for new users. (Guest20 is reserved for the 20th join)
                            if (guestCheck.test(args[1]))
                            {
                                chatLog(`${users[i].username} has attmpted to change their username to ${args[1]} but failed because it's reserved for guests.`);
                                client.write(`Sorry, ${args[1]} is reserved for guests.`);
                            }
                            else
                            {
                                let usernameInUse = false;
                                for (let j = 0; j < users.length; j++) //checks if users already have the desired username
                                {
                                    if (users[j].username == args[1])
                                    {
                                        usernameInUse = true;
                                        break;
                                    }
                                }
                                if (usernameInUse)
                                {
                                    chatLog(`${users[i].username} has attmpted to change their username to ${args[1]} but failed because username was already in use.`);
                                    client.write(`Sorry, ${args[1]} is already being used.`);
                                }
                                else
                                {
                                    for (let j = 0; j < users.length; j++)
                                    {
                                        if (users[j].id != client)
                                        {
                                            users[j].id.write(`${users[i].username} will now be known as ${args[1]}`);
                                        }
                                    }
                                    chatLog(`${users[i].username} has changed their username to ${args[1]}`);
                                    users[i].username = args[1];
                                    client.write(`Your new username is ${args[1]}`);
                                }
                            }
                        }
                        break;
                    case "PASSWORD":
                        chatLog(`User "${users[i].username}" used PASSWORD`);
                        if (client == users[0].id)
                        {
                            if (args[1] != undefined)
                            {
                                client.write(`Password changed to ${args[1]}`);
                                chatLog(`${users[0].username} changed the password to ${args[1]}`);
                                password = args[1];
                            }
                            else
                            {
                                client.write(`Current password is ${password}\nIf you intended to change the password, use: PASSWORD <password>`);
                            }
                        }
                        else
                        {
                            client.write("Sorry, you are not the server admin.");
                        }
                        break;
                    case "KICK": //Kick does not care if you are admin. If you have the password you can kick anyone.
                        chatLog(`User "${users[i].username}" used KICK`);
                        for (let j = 0; j < users.length; j++)
                        {
                            if (users[j].username == args[1])
                            {
                                if (args[2] == password)
                                {
                                    client.write(`${users[j].username} was kicked.`);
                                    users[j].id.write("You have been kicked.");
                                    users[j].id.end();
                                    chatLog(`${users[j].username} was kicked by ${users[i].username}.`);
                                    if (j == 0 && users.length > 1)
                                    {
                                        users[j + 1].id.write(`You are the new admin. The current password is ${password}`);
                                    }
                                    users.splice(j, 1);
                                }
                                else
                                {
                                    client.write(`Incorrect password.`);
                                }
                                break;
                            }
                            else if (users.length - 1 == j)
                            {
                                client.write(`${args[1]} does not exist.`);
                            }
                        }
                        break;
                    case "CLIENTLIST":
                        chatLog(`User "${users[i].username}" used CLIENTLIST`);
                        let output = "Clients: \nADMIN: ";
                        for (let j = 0; j < users.length; j++)
                        {
                            if (j == 0)
                            {
                                output += users[j].username + "\nOTHER CLIENTS: ";
                            }
                            else
                            {
                                output += users[j].username + ", ";
                            }
                        }
                        client.write(output.substring(0, output.length - 2));
                        break;
                    case "W":
                    case "WHISPER":
                        chatLog(`User "${users[i].username}" used WHISPER`);
                        for (let j = 0; j < users.length; j++)
                        {
                            if (users[j].username == args[1])
                            {
                                if (args[2] != undefined)
                                {
                                    let message = input.substring(args[0].length + args[1].length + 2);
                                    client.write(`You -> ${users[j].username}: ${message}`);
                                    users[j].id.write(`${users[i].username} -> You: ${message}`);
                                    chatLog(`${users[i].username} -> ${users[j].username}: ${message}`);
                                    break;
                                }
                            }
                            else if (users.length - 1 == j)
                            {
                                client.write(`${args[1]} does not exist.`);
                            }
                        }
                        break;
                    default:
                        for (let j = 0; j < users.length; j++)
                        {
                            if (users[j].id != client)
                            {
                                users[j].id.write(`${users[i].username}: ${input}`);
                            }
                        }
                        chatLog(`${users[i].username} sent: ${input}`);
                        break;
                }
                break;
            }
        }
    })
}).listen(80);

function chatLog(message)
{
    console.log(message);
    fs.appendFileSync("./chat.log", message + "\n");
}