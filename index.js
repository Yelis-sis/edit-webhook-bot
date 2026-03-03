require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  WebhookClient
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once("ready", () => {
  console.log("Bot ready");
});


// ===== SLASH COMMAND =====
client.on(Events.InteractionCreate, async interaction => {

  if (interaction.isChatInputCommand()) {

    if (interaction.commandName !== "edit") return;

    if (!interaction.member.roles.cache.has(process.env.ROLE_ID)) {
      return interaction.reply({
        content: "Нет доступа",
        ephemeral: true
      });
    }

    const input = interaction.options.getString("message");
    const messageId = input.split("/").pop();

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    const message = await channel.messages.fetch(messageId);

    if (!message.webhookId)
      return interaction.reply({
        content: "Это не webhook сообщение",
        ephemeral: true
      });

    const button = new ButtonBuilder()
      .setCustomId(`edit_${message.id}`)
      .setLabel("✏️ Редактировать")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      content: "Редактор:",
      components: [row],
      ephemeral: true
    });
  }


  // ===== BUTTON =====
  if (interaction.isButton()) {

    const messageId = interaction.customId.replace("edit_", "");

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    const message = await channel.messages.fetch(messageId);

    // === Получаем полный webhook-message ===
    const webhooks = await channel.fetchWebhooks();
    const webhook = webhooks.find(w => w.id === message.webhookId);

    const hookClient = new WebhookClient({
      id: webhook.id,
      token: webhook.token
    });

    const fullMessage = await hookClient.fetchMessage(messageId);

    // === Извлекаем текст ===
    let originalText = "";

    if (fullMessage.content) {
      originalText = fullMessage.content;
    } else if (fullMessage.embeds.length > 0) {
      const embed = fullMessage.embeds[0];
      const parts = [];

      if (embed.title) parts.push(embed.title);
      if (embed.description) parts.push(embed.description);

      if (embed.fields?.length > 0) {
        embed.fields.forEach(f => {
          parts.push(`${f.name}: ${f.value}`);
        });
      }

      if (embed.footer?.text) parts.push(embed.footer.text);

      originalText = parts.join("\n\n");
    }

    if (!originalText) originalText = "";

    const modal = new ModalBuilder()
      .setCustomId(`modal_${messageId}`)
      .setTitle("Редактирование");

    const input = new TextInputBuilder()
      .setCustomId("text")
      .setLabel("Измените текст")
      .setStyle(TextInputStyle.Paragraph)
      .setValue(originalText);

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );

    await interaction.showModal(modal);
  }


  // ===== SAVE =====
  if (interaction.isModalSubmit()) {

    const messageId = interaction.customId.replace("modal_", "");
    const newText = interaction.fields.getTextInputValue("text");

    const channel = await client.channels.fetch(process.env.CHANNEL_ID);
    const message = await channel.messages.fetch(messageId);

    const webhooks = await channel.fetchWebhooks();
    const webhook = webhooks.find(w => w.id === message.webhookId);

    const hookClient = new WebhookClient({
      id: webhook.id,
      token: webhook.token
    });

    await hookClient.editMessage(messageId, {
      content: newText
    });

    await interaction.reply({
      content: "✅ Сообщение обновлено",
      ephemeral: true
    });
  }

});

client.login(process.env.TOKEN);
