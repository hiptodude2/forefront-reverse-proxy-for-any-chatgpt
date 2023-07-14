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

6. Use by setting your url as openai reverse proxy in jai and turn off text streaming

```txt
http://localhost:3000/v2/poe
```

if localhost url not working. you may need to expose your localhost with cloudflared

7. expose localhost with cloudflared in another cmd (optional)

```bash
npm install -g cloudflared
cloudflared tunnel --url localhost:3000
```

your exposed url should looks like this
```bash
https://rooms-physical-growth-chest.trycloudflare.com/
```
and you can use https://rooms-physical-growth-chest.trycloudflare.com/v2/poe as reverse proxy link



# Currently not working with bot that has more than 700 permanent token and will have weird response if using with bot that is situation/world setting

# License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
