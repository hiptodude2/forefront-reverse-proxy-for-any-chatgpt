## Fork of pawan reverse proxy

# Self-Host Your Own API

To self-host your own parser, you can use the following steps:

1. [Get your poe cookie](https://platform.openai.com/account/api-keys)
2. Clone this repository and install the dependencies:

```bash
git clone https://github.com/4e4f4148/JanitorAI-POE-Proxy.git
cd JanitorAI-POE-Parser
npm install
```

3. Set your poe key and other configurations in the `config.js` file.
4. Start the server:

```bash
npm start
```

4. Use by setting your url as openai reverse proxy in jai and turn off text streaming

```txt
http://localhost:3000/v2/poe
```

if localhost url not working. you may need to expose your localhost with ngrok/localtunnel/cloudflared

5. expose localhost with cloudflared

```bash
npm install -g cloudflared
cloudflared tunnel --url localhost:3000
```

your exposed url should looks like https://rooms-physical-growth-chest.trycloudflare.com/
and use https://rooms-physical-growth-chest.trycloudflare.com/v2/poe as reverse proxy link

#Currently not working with bot that has more than 700 permanent token

# License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
