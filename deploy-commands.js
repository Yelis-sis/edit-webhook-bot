require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("edit")
    .setDescription("Редактировать webhook сообщение")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("Ссылка или ID сообщения")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Показать меню правил сервера"),
  new SlashCommandBuilder()
    .setName("subscribe")
    .setDescription("Подписаться на важные каналы")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("Commands deployed");
})();