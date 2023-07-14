## Fork of pawan reverse proxy

# Self-Host Your Own API

To self-host your own ChatGPT API, you can use the following steps:

1. [Get your poe cookie](https://platform.openai.com/account/api-keys)
2. Clone this repository and install the dependencies:

```bash
git clone https://github.com/4e4f4148/JanitorAI-POE-Parser.git
cd ChatGPT
npm install
```

3. Set your poe key and other configurations in the `config.js` file.
4. Start the server:

```bash
npm start
```

4. Use by setting your url as openai reverse proxy in jai

```txt
http://localhost:3000/v2/poe
```

You may need ngrok, if localhost url notworking

# License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
