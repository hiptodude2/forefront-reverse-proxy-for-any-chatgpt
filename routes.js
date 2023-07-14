import axios from "axios";
import { Configuration, OpenAIApi } from "openai";
import { streamCompletion, generateId, getOpenAIKey, getPoeKey } from "./functions.js"
import { DEBUG, MODERATION } from "./config.js";
import * as poe from './poe-client.js'

async function convertOAItoPOE(messages){
    let charname = ''
    let newprompt = ''

    let systemsplit = messages[0].content.split('.');
    // console.log("SPLIT FORMAT: \n")
    for(let sentence in systemsplit){
        // console.log(sentence)
        if(systemsplit[sentence].includes("{{char}}'s name: ")){
            charname = systemsplit[sentence].substring(17, systemsplit[sentence].length)
            // console.log(systemsplit[sentence].substring(systemsplit[sentence].text.length - 17))
            break
        }
    }
    console.log('charname: ' + charname)

    // console.log('OAI FORMAT: \n')
    // console.log(messages)
    for(let i in messages){
        console.log(messages[i])
        if(messages[i].role === 'system'){
            newprompt += messages[i].content
            newprompt += "\n\n"
        }
        if(messages[i].role === 'assistant'){
            newprompt += `${charname}: `
            newprompt += messages[i].content
            newprompt += "\n"
        }
        if(messages[i].role === 'user'){
            newprompt += 'You: '
            newprompt += messages[i].content
            newprompt += "\n"
        }
    }

    newprompt += '[Unless otherwise stated by {{user}}, your next response shall only be written from the point of view of {{char}}. Do not seek approval of your writing style at the end of the response. Never reply with a full stop.]\n'

    console.log("POE FORMAT: \n")
    console.log(newprompt)
    return newprompt
}

async function convertPOEtoOAI(messages,maxtoken){
    let orgId = generateId();
    
    let newresponse = {
        id: orgId,
        object: 'chat.completion',
        created: Date.now(),
        model: "gpt-3.5-turbo-0613",
        choices: [
            {
              "index": 0,
              "message": {
                "role": "assistant",
                "content": messages
              },
              "finish_reason": "length"
            }
          ],
        "usage": {
            "prompt_tokens": 0,
            "completion_tokens": maxtoken,
            "total_tokens": maxtoken
        }
    }
    return newresponse
}

async function completions(req, res) {
    let orgId = generateId();
    let key = getOpenAIKey();

    if (!req.body.prompt) {
        res.set("Content-Type", "application/json");
        return res.status(400).send({
            status: false,
            error: "No prompt provided"
        });
    }

    if (DEBUG) console.log(`[Text] [${req.user.data.id}] [${req.user.data.name}] [MAX-TOKENS:${req.body.max_tokens ?? "unset"}] ${req.body.prompt}`);

    if (MODERATION) {
        try {
            let openAi = new OpenAIApi(new Configuration({ apiKey: key }));
            let response = await openAi.createModeration({
                input: req.body.prompt,
            });

            if (response.data.results[0].flagged) {
                res.set("Content-Type", "application/json");
                return res.status(400).send({
                    status: false,
                    error: "Your prompt contains content that is not allowed",
                    reason: response.data.results[0].reason,
                    contact: "https://discord.pawan.krd"
                });
            }
        }
        catch (e) {

        }
    }

    if (req.body.stream) {
        try {
            const response = await axios.post(
                `https://api.openai.com/v1/completions`, req.body,
                {
                    responseType: "stream",
                    headers: {
                        Accept: "text/event-stream",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${key}`,
                    },
                },
            );

            res.setHeader("content-type", "text/event-stream");

            for await (const message of streamCompletion(response.data)) {
                try {
                    const parsed = JSON.parse(message);
                    delete parsed.id;
                    delete parsed.created;
                    res.write(`data: ${JSON.stringify(parsed)}\n\n`);
                } catch (error) {
                    if (DEBUG) console.error("Could not JSON parse stream message", message, error);
                }
            }

            res.write(`data: [DONE]`);
            res.end();
        } catch (error) {
            try {
                if (error.response && error.response.data) {
                    let errorResponseStr = "";

                    for await (const message of error.response.data) {
                        errorResponseStr += message;
                    }

                    errorResponseStr = errorResponseStr.replace(/org-[a-zA-Z0-9]+/, orgId);

                    const errorResponseJson = JSON.parse(errorResponseStr);
                    return res.status(error.response.status).send(errorResponseJson);
                } else {
                    if (DEBUG) console.error("Could not JSON parse stream message", error);
                    return res.status(500).send({
                        status: false,
                        error: "something went wrong!"
                    });
                }
            }
            catch (e) {
                console.log(e);
                return res.status(500).send({
                    status: false,
                    error: "something went wrong!"
                });
            }
        }
    }
    else {
        try {
            const response = await axios.post(
                `https://api.openai.com/v1/completions`, req.body,
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${key}`,
                    },
                },
            );

            delete response.data.id;
            delete response.data.created;

            return res.status(200).send(response.data);
        } catch (error) {
            try {
                error.response.data.error.message = error.response.data.error.message.replace(/org-[a-zA-Z0-9]+/, orgId);
                return res.status(error.response.status).send(error.response.data);
            }
            catch (e) {
                if (DEBUG) console.log(e);
                return res.status(500).send({
                    status: false,
                    error: "something went wrong!"
                });
            }
        }
    }
}

async function chatCompletions(req, res) {
    let orgId = generateId();
    let key = getOpenAIKey();

    if (MODERATION) {
        try {
            let prompt = [];
            try {
                req.body.messages.forEach(element => {
                    prompt.push(element.content);
                });
            }
            catch (e) {
                return res.status(400).send({
                    status: false,
                    error: "messages is required! and must be an array of objects with content and author properties"
                });
            }

            if (DEBUG) console.log(`[CHAT] [${req.user.data.id}] [${req.user.data.name}] [MAX-TOKENS:${req.body.max_tokens ?? "unset"}] ${prompt}`);

            let openAi = new OpenAIApi(new Configuration({ apiKey: key }));
            let response = await openAi.createModeration({
                input: prompt,
            });

            if (response.data.results[0].flagged) {
                res.set("Content-Type", "application/json");
                return res.status(400).send({
                    status: false,
                    error: "Your prompt contains content that is not allowed",
                    reason: response.data.results[0].reason,
                    support: "https://discord.pawan.krd"
                });
            }
        }
        catch (e) {
            if (DEBUG) console.log(e);
            return res.status(500).send({
                status: false,
                error: "something went wrong!"
            });
        }
    }
    else {
        if (DEBUG) console.log(`[CHAT] [${req.user.data.id}] [${req.user.data.name}] [MAX-TOKENS:${req.body.max_tokens ?? "unset"}]`);
    }

    if (req.body.stream) {
        try {
            const response = await axios.post(
                `https://api.openai.com/v1/chat/completions`, req.body,
                {
                    responseType: "stream",
                    headers: {
                        Accept: "text/event-stream",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${key}`,
                    },
                },
            );

            res.setHeader("content-type", "text/event-stream");

            for await (const message of streamCompletion(response.data)) {
                try {
                    const parsed = JSON.parse(message);
                    delete parsed.id;
                    delete parsed.created;
                    const { content } = parsed.choices[0].delta;
                    if (content) {
                        res.write(`data: ${JSON.stringify(parsed)}\n\n`);
                    }
                } catch (error) {
                    if (DEBUG) console.error("Could not JSON parse stream message", message, error);
                }
            }

            res.write(`data: [DONE]`);
            res.end();
        } catch (error) {
            try {
                if (error.response && error.response.data) {
                    let errorResponseStr = "";

                    for await (const message of error.response.data) {
                        errorResponseStr += message;
                    }

                    errorResponseStr = errorResponseStr.replace(/org-[a-zA-Z0-9]+/, orgId);

                    const errorResponseJson = JSON.parse(errorResponseStr);
                    return res.status(error.response.status).send(errorResponseJson);
                } else {
                    if (DEBUG) console.error("Could not JSON parse stream message", error);
                    return res.status(500).send({
                        status: false,
                        error: "something went wrong!"
                    });
                }
            }
            catch (e) {
                if (DEBUG) console.log(e);
                return res.status(500).send({
                    status: false,
                    error: "something went wrong!"
                });
            }
        }
    }
    else {
        try {
            const response = await axios.post(
                `https://api.openai.com/v1/chat/completions`, req.body,
                {
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${key}`,
                    },
                },
            );

            delete response.data.id;
            delete response.data.created;

            return res.status(200).send(response.data);
        } catch (error) {
            try {
                error.response.data.error.message = error.response.data.error.message.replace(/org-[a-zA-Z0-9]+/, orgId);
                return res.status(error.response.status).send(error.response.data);
            }
            catch (e) {
                if (DEBUG) console.log(e);
                return res.status(500).send({
                    status: false,
                    error: "something went wrong!"
                });
            }
        }
    }
}

async function getPoeClient(token, useCache = false) {
    let client;

        client = new poe.Client(true, useCache);
        console.log(client)
        await client.init(token);
    return client;
}

async function poeCompletions(request, response) {

    let key = getPoeKey();

    if (!request.body.prompt) {
        return response.sendStatus(400);
    }

    const token = key

    if (!token) {
        return response.sendStatus(401);
    }

    const prompt = request.body.prompt;
    const bot = request.body.bot ?? POE_DEFAULT_BOT;
    const streaming = request.body.streaming ?? false;

    let client;

    try {
        client = await getPoeClient(token, true);
    }
    catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }

    if (streaming) {
        try {
            response.write('streaming is not supported');
        }
        catch (err) {
            console.error(err);
        }
        finally {
            //client.disconnect_ws();
            response.end();
        }
    }
    else {
        try {
            let reply;
            let messageId;
            for await (const mes of client.send_message(bot, prompt, false, 60)) {
                reply = mes.text;
                messageId = mes.messageId;
            }
            console.log('reply on')
            console.log(reply);
            //client.disconnect_ws();
            response.set('X-Message-Id', String(messageId));
            return response.send({ 'reply': reply });
        }
        catch {
            //client.disconnect_ws();
            return response.sendStatus(500);
        }
    }
}

async function poe2Completions(request, response) {

    let maxtoken = request.body.max_tokens
    request.body = {
        bot: 'capybara',
        streaming: false,
        prompt:  await convertOAItoPOE(request.body.messages)
    }
    console.log(request.body)
    let key = getPoeKey();

    if (!request.body.prompt) {
        return response.sendStatus(400);
    }

    const token = key

    if (!token) {
        return response.sendStatus(401);
    }

    const count = request.body.count ?? -1;


    const prompt = request.body.prompt;
    const bot = request.body.bot ?? POE_DEFAULT_BOT;
    const streaming = request.body.streaming ?? false;

    let client;

    try {
        client = await getPoeClient(token, true);
        await client.purge_conversation(bot, count);
    }
    catch (error) {
        console.error(error);
        return response.sendStatus(500);
    }

    if (streaming) {
        try {
            response.write('streaming is not supported');
        }
        catch (err) {
            console.error(err);
        }
        finally {
            //client.disconnect_ws();
            response.end();
        }
    }
    else {
        try {
            
            let reply;
            let messageId;
            for await (const mes of client.send_message(bot, prompt, false, 60)) {
                reply = mes.text;
                messageId = mes.messageId;
            }
            // console.log('reply on')
            // console.log(reply);
            let replyasOAI = await convertPOEtoOAI(reply,maxtoken)
            console.log(replyasOAI)
            //client.disconnect_ws();
            response.set('X-Message-Id', String(messageId));
            return response.status(200).send(replyasOAI);
        }
        catch {
            //client.disconnect_ws();
            return response.sendStatus(500);
        }
    }
}
export { completions, chatCompletions, poeCompletions, poe2Completions };
