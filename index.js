import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import { chatGPT } from 'free-chatgpt-3.5-turbo-api';
import fs from 'fs/promises';
import config from './config.json' assert { type: 'json' };

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Evento 'ready'
client.once('ready', () => {
  console.clear();
  console.log(`[BOT] - ${client.user.tag} foi iniciado com sucesso!`);
  
  const guildsSize = client.guilds.cache.size;
  const membersSize = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
  const channelsSize = client.channels.cache.size;

  console.log(`\n[BOT] - Conectado a ${guildsSize} servidores`);
  console.log(`[BOT] - Monitorando um total de ${membersSize} membros`);
  console.log(`[BOT] - Acessando ${channelsSize} canais`);
  console.log("\n[BOT] - Status da Conexão:");
  console.log(`[BOT] - Latência da WebSocket: ${client.ws.ping}ms`);
  console.log(`[BOT] - Online desde: ${client.readyAt.toLocaleString()}`);

  client.user.setActivity(`${guildsSize} servidores | ${membersSize} membros`, { type: ActivityType.Watching });

  client.ws.on('error', console.error);
  client.ws.on('close', () => console.log(`[BOT] - Conexão fechada! Tentando reconectar...`));

  client.on('reconnecting', () => {
    console.log(`[BOT] - Tentando reconectar...`);
  });

  console.log("\n[BOT] - Configurações finalizadas e bot em operação!");
});

// Evento 'messageCreate'
client.on('messageCreate', async (message) => {
  if (message.channel.id === config.canalGPT && !message.author.bot) {
    const consultandoMsg = await message.reply('Formulando...');
    try {
      const resultado = await chatGPT({ prompt: message.content });

      if (resultado.length >= 400) {
        const fileName = 'resposta.txt';
        await fs.writeFile(fileName, resultado);

        await consultandoMsg.edit({
          content: 'Resposta muito longa. Enviando como arquivo...',
          files: [fileName],
        });

        await fs.unlink(fileName);
      } else {
        await consultandoMsg.edit({ content: resultado });
      }
    } catch (error) {
      console.error('Erro ao consultar o ChatGPT:', error);
      await consultandoMsg.edit('Ocorreu um erro ao consultar o ChatGPT. Tente novamente mais tarde.');
    }
  }
});

client.login(config.token);
