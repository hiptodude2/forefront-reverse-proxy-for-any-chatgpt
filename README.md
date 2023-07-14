## Fork of pawan reverse proxy

# Self-Host Your Own API

To self-host your own parser, you can use the following steps:

1. install [node.js](https://nodejs.org/en)

2. [Get your poe cookie](https://docs.sillytavern.app/usage/api-connections/poe/)
3. Clone this repository and install the dependencies:

```bash
git clone https://github.com/4e4f4148/JanitorAI-POE-Proxy.git
cd JanitorAI-POE-Proxy
npm install
```

4. Set your poe key and other configurations in the `config.js` file.
5. Start the server:

```bash
npm start
```

6. You can use it by setting your POE REVERSE PROXY URL as openai reverse proxy in jai and turn off text streaming

```txt
POE REVERSE PROXY URL: https://trend-want-question-italiano.trycloudflare.com/v2/poe
LOCAL URL: http://localhost:3001/v2/poe
Listening on 3001 ...
```


# Currently not working with bot that has more than 700 permanent token and will have weird response if using with bot that is situation/world setting

# License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
