require('dotenv').config();

const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    UserSelectMenuBuilder,
    MessageFlags,
    AttachmentBuilder
} = require('discord.js');


// ======================================================
// CLIENT
// ======================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


// ======================================================
// CONFIG
// ======================================================

const CONFIG = {

    // ROLE
    TEAM_SL_ROLE: '1292371740109836339',
    BUG_REPORT_ROLE: '1523846923377836093',

    // KANALI
    TICKET_PANEL_CHANNEL: '1292371924760137748',
    TICKET_LOG_CHANNEL: '1323630761466789961',

    // KATEGORIJE
    CATEGORY_POMOC: '1323633149208563732',
    CATEGORY_DONACIJA: '1540422324120199188',
    CATEGORY_BUG: '1540422469855215801'
};


// ======================================================
// BOT ONLINE
// ======================================================

client.once('clientReady', async () => {

    console.log(`✅ SLOLINE TICKET ONLINE: ${client.user.tag}`);

    try {

        await createOrUpdatePanel();

    } catch (error) {

        console.error('❌ NAPAKA PRI TICKET PANELU:');
        console.error(error);
    }
});


// ======================================================
// TICKET PANEL
// ======================================================

async function createOrUpdatePanel() {

    const channel = await client.channels.fetch(
        CONFIG.TICKET_PANEL_CHANNEL
    );


    if (!channel || !channel.isTextBased()) {

        console.log('❌ Ticket panel kanal ni najden.');
        return;
    }


    const panelEmbed = new EmbedBuilder()

        .setTitle('🎫 SLOLINE | TICKET')

        .setDescription(
            'Potrebujete pomoč ali imate vprašanje? Izberite ustrezno kategorijo spodaj in odprite ticket. Naše osebje vam bo pomagalo v najkrajšem možnem času.\n\n' +

            '• Ob odprtju ticketa svojo zadevo **jasno in podrobno opišite** ter dodajte vse pomembne informacije.\n' +

            '• Če ticket odpirate zaradi **kršitve pravil**, morate ob odprtju priložiti tudi **ustrezno dokazno gradivo** (clip).\n' +

            '• Izberite **ustrezno kategorijo** glede na vašo zadevo.\n' +

            '• Na posamezno kategorijo imate lahko odprt samo **1 ticket hkrati**.\n' +

            '• Po odprtju ticketa **počakajte na odgovor osebja** in ga ne označujte po nepotrebnem.\n\n' +

            '**Spodaj izberite ustrezno kategorijo in odprite ticket.**'
        )

        .setFooter({
            text: 'SLOLINE Official'
        })

        .setTimestamp();


    // ==================================================
    // PANEL GUMBI
    // ==================================================

    const pomocButton = new ButtonBuilder()
        .setCustomId('ticket_pomoc')
        .setLabel('Pomoč')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Primary);


    const donacijaButton = new ButtonBuilder()
        .setCustomId('ticket_donacija')
        .setLabel('Donacija')
        .setEmoji('💸')
        .setStyle(ButtonStyle.Primary);


    const bugButton = new ButtonBuilder()
        .setCustomId('ticket_bug')
        .setLabel('Bug')
        .setEmoji('🛠️')
        .setStyle(ButtonStyle.Primary);


    const panelButtons = new ActionRowBuilder()
        .addComponents(
            pomocButton,
            donacijaButton,
            bugButton
        );


    // ==================================================
    // PREVERI, ČE PANEL ŽE OBSTAJA
    // ==================================================

    const messages = await channel.messages.fetch({
        limit: 50
    });


    const existingPanel = messages.find(message => {

        if (message.author.id !== client.user.id) {
            return false;
        }


        return message.components.some(row =>
            row.components.some(component =>
                component.customId === 'ticket_pomoc'
            )
        );
    });


    // ==================================================
    // POSODOBI PANEL
    // ==================================================

    if (existingPanel) {

        await existingPanel.edit({

            embeds: [
                panelEmbed
            ],

            components: [
                panelButtons
            ]
        });


        console.log('✅ Ticket panel posodobljen.');

        return;
    }


    // ==================================================
    // NOV PANEL
    // ==================================================

    await channel.send({

        embeds: [
            panelEmbed
        ],

        components: [
            panelButtons
        ]
    });


    console.log('✅ Ticket panel ustvarjen.');
}


// ======================================================
// INTERACTIONS
// ======================================================

client.on('interactionCreate', async interaction => {

    try {

        // ==================================================
        // BUTTONI
        // ==================================================

        if (interaction.isButton()) {


            // ----------------------------------------------
            // POMOČ
            // ----------------------------------------------

            if (interaction.customId === 'ticket_pomoc') {

                await interaction.deferReply({
                    flags: MessageFlags.Ephemeral
                });


                await createTicket(
                    interaction,
                    'pomoc'
                );


                return;
            }


            // ----------------------------------------------
            // DONACIJA
            // ----------------------------------------------

            if (interaction.customId === 'ticket_donacija') {

                await interaction.deferReply({
                    flags: MessageFlags.Ephemeral
                });


                await createTicket(
                    interaction,
                    'donacija'
                );


                return;
            }


            // ----------------------------------------------
            // BUG
            // ----------------------------------------------

            if (interaction.customId === 'ticket_bug') {

                await interaction.deferReply({
                    flags: MessageFlags.Ephemeral
                });


                await createTicket(
                    interaction,
                    'bug'
                );


                return;
            }


            // ----------------------------------------------
            // ZAPRI TICKET
            // ----------------------------------------------

            if (interaction.customId === 'close_ticket') {

                await askCloseConfirmation(
                    interaction
                );


                return;
            }


            // ----------------------------------------------
            // POTRDI ZAPRTJE
            // ----------------------------------------------

            if (
                interaction.customId ===
                'confirm_close_ticket'
            ) {

                await closeTicket(
                    interaction
                );


                return;
            }


            // ----------------------------------------------
            // PREKLIČI ZAPRTJE
            // ----------------------------------------------

            if (
                interaction.customId ===
                'cancel_close_ticket'
            ) {

                await interaction.update({

                    content:
                        '❌ Zapiranje ticketa je bilo preklicano.',

                    components: []
                });


                return;
            }


            // ----------------------------------------------
            // DODAJ OSEBO
            // ----------------------------------------------

            if (interaction.customId === 'add_person') {

                await showUserSelect(
                    interaction
                );


                return;
            }
        }


        // ==================================================
        // USER SELECT
        // ==================================================

        if (interaction.isUserSelectMenu()) {

            if (
                interaction.customId ===
                'ticket_add_user_select'
            ) {

                await addSelectedUser(
                    interaction
                );


                return;
            }
        }


    } catch (error) {

        console.error('❌ INTERACTION ERROR:');
        console.error(error);


        try {

            if (
                interaction.replied ||
                interaction.deferred
            ) {

                await interaction.editReply({

                    content:
                        '❌ Prišlo je do napake. Poskusite ponovno.',

                    components: []
                });

            } else {

                await interaction.reply({

                    content:
                        '❌ Prišlo je do napake. Poskusite ponovno.',

                    flags:
                        MessageFlags.Ephemeral
                });
            }

        } catch (replyError) {

            console.error(
                '❌ Napaka pri pošiljanju error odgovora:'
            );

            console.error(replyError);
        }
    }
});


// ======================================================
// CREATE TICKET
// ======================================================

async function createTicket(
    interaction,
    ticketType
) {

    const guild = interaction.guild;
    const user = interaction.user;


    let categoryId;
    let channelName;
    let title;
    let emoji;
    let description;
    let pingRole;


    // ==================================================
    // POMOČ
    // ==================================================

    if (ticketType === 'pomoc') {

        categoryId =
            CONFIG.CATEGORY_POMOC;

        channelName =
            `pomoc-${user.username}`;

        title =
            'Pomoč';

        emoji =
            '🛡️';

        pingRole =
            CONFIG.TEAM_SL_ROLE;

        description =
            'Prosimo, **opišite svojo težavo ali vprašanje** ter po potrebi priložite **sliko ali posnetek (clip)**, ki prikazuje težavo.';
    }


    // ==================================================
    // DONACIJA
    // ==================================================

    else if (ticketType === 'donacija') {

        categoryId =
            CONFIG.CATEGORY_DONACIJA;

        channelName =
            `donacija-${user.username}`;

        title =
            'Donacija';

        emoji =
            '💸';

        pingRole =
            CONFIG.TEAM_SL_ROLE;

        description =
            'Prosimo, opišite **kaj želite kupiti oziroma glede česa donirate**. Če želite kupiti izdelek s spletne strani, priložite tudi **povezavo do izdelka**.';
    }


    // ==================================================
    // BUG
    // ==================================================

    else if (ticketType === 'bug') {

        categoryId =
            CONFIG.CATEGORY_BUG;

        channelName =
            `bug-${user.username}`;

        title =
            'Bug';

        emoji =
            '🛠️';

        // Bug pinga SAMO Bug Report.
        pingRole =
            CONFIG.BUG_REPORT_ROLE;

        description =
            'Prosimo, da **čim bolj podrobno opišete bug** ter priložite **clip ali sliko**, kjer je napaka jasno vidna.';
    }


    else {

        await interaction.editReply({

            content:
                '❌ Neveljavna vrsta ticketa.'
        });


        return;
    }


    // ==================================================
    // PREVERI OBSTOJEČ TICKET
    // ==================================================

    const existingTicket =
        guild.channels.cache.find(channel => {

            if (
                channel.type !==
                ChannelType.GuildText
            ) {

                return false;
            }


            if (!channel.topic) {

                return false;
            }


            return (

                channel.topic.includes(
                    `ticket-owner:${user.id}`
                )

                &&

                channel.topic.includes(
                    `ticket-type:${ticketType}`
                )
            );
        });


    if (existingTicket) {

        await interaction.editReply({

            content:
                `❌ V kategoriji **${title}** že imate odprt ticket: ${existingTicket}`
        });


        return;
    }


    // ==================================================
    // PREVERI KATEGORIJO
    // ==================================================

    let category;


    try {

        category =
            await guild.channels.fetch(
                categoryId
            );

    } catch {

        category = null;
    }


    if (
        !category ||
        category.type !== ChannelType.GuildCategory
    ) {

        await interaction.editReply({

            content:
                `❌ Kategorija za **${title}** ni pravilno nastavljena.`
        });


        return;
    }


    // ==================================================
    // PERMISSION OVERWRITES
    // ==================================================

    const permissionOverwrites = [


        // ------------------------------------------------
        // @EVERYONE
        // ------------------------------------------------

        {
            id:
                guild.roles.everyone.id,

            deny: [

                PermissionFlagsBits.ViewChannel
            ]
        },


        // ------------------------------------------------
        // BOT
        // ------------------------------------------------

        {
            id:
                client.user.id,

            allow: [

                PermissionFlagsBits.ViewChannel,

                PermissionFlagsBits.SendMessages,

                PermissionFlagsBits.ReadMessageHistory,

                PermissionFlagsBits.AttachFiles,

                PermissionFlagsBits.EmbedLinks,

                PermissionFlagsBits.ManageChannels,

                PermissionFlagsBits.ManageMessages
            ]
        },


        // ------------------------------------------------
        // LASTNIK TICKETA
        // ------------------------------------------------

        {
            id:
                user.id,

            allow: [

                PermissionFlagsBits.ViewChannel,

                PermissionFlagsBits.SendMessages,

                PermissionFlagsBits.ReadMessageHistory,

                PermissionFlagsBits.AttachFiles,

                PermissionFlagsBits.EmbedLinks
            ]
        },


        // ------------------------------------------------
        // TEAM SLOLINE
        // ------------------------------------------------

        {
            id:
                CONFIG.TEAM_SL_ROLE,

            allow: [

                PermissionFlagsBits.ViewChannel,

                PermissionFlagsBits.SendMessages,

                PermissionFlagsBits.ReadMessageHistory,

                PermissionFlagsBits.AttachFiles,

                PermissionFlagsBits.EmbedLinks
            ]
        }
    ];


    // ==================================================
    // BUG REPORT DOSTOP
    // ==================================================

    if (ticketType === 'bug') {

        permissionOverwrites.push({

            id:
                CONFIG.BUG_REPORT_ROLE,

            allow: [

                PermissionFlagsBits.ViewChannel,

                PermissionFlagsBits.SendMessages,

                PermissionFlagsBits.ReadMessageHistory,

                PermissionFlagsBits.AttachFiles,

                PermissionFlagsBits.EmbedLinks
            ]
        });
    }


    // ==================================================
    // USTVARI TICKET CHANNEL
    // ==================================================

    let ticketChannel;


    try {

        ticketChannel =
            await guild.channels.create({

                name:
                    cleanChannelName(
                        channelName
                    ),

                type:
                    ChannelType.GuildText,

                parent:
                    categoryId,

                topic:
                    `ticket-owner:${user.id}|ticket-type:${ticketType}`,

                permissionOverwrites:
                    permissionOverwrites
            });


    } catch (error) {

        console.error(
            '❌ NAPAKA PRI USTVARJANJU TICKETA:'
        );

        console.error(error);


        await interaction.editReply({

            content:
                '❌ Ticketa ni bilo mogoče ustvariti. Preverite dovoljenja bota v Discord kategoriji.'
        });


        return;
    }


    // ==================================================
    // TICKET EMBED
    // ==================================================

    const ticketEmbed =
        new EmbedBuilder()

            .setTitle(
                `${emoji} ${title}`
            )

            .setDescription(
                `Pozdravljeni ${user}!\n\n` +

                `Vaš **${title}** ticket je bil uspešno odprt.\n\n` +

                `${description}\n\n` +

                'Počakajte na odgovor osebja.'
            )

            .addFields(

                {
                    name:
                        'Uporabnik',

                    value:
                        `${user}`,

                    inline:
                        true
                },

                {
                    name:
                        'Kategorija',

                    value:
                        title,

                    inline:
                        true
                }
            )

            .setFooter({

                text:
                    'SLOLINE Official • Ticket System'
            })

            .setTimestamp();


    // ==================================================
    // ZAPRI BUTTON
    // ==================================================

    const closeButton =
        new ButtonBuilder()

            .setCustomId(
                'close_ticket'
            )

            .setLabel(
                'ZAPRI TICKET'
            )

            .setEmoji('🔒')

            .setStyle(
                ButtonStyle.Danger
            );


    // ==================================================
    // DODAJ OSEBO BUTTON
    // ==================================================

    const addPersonButton =
        new ButtonBuilder()

            .setCustomId(
                'add_person'
            )

            .setLabel(
                'DODAJ OSEBO'
            )

            .setEmoji('➕')

            .setStyle(
                ButtonStyle.Success
            );


    const ticketButtons =
        new ActionRowBuilder()

            .addComponents(
                closeButton,
                addPersonButton
            );


    // ==================================================
    // POŠLJI ZAČETNO SPOROČILO
    // ==================================================

    try {

        await ticketChannel.send({

            content:
                `<@&${pingRole}>`,

            allowedMentions: {

                roles: [
                    pingRole
                ]
            },

            embeds: [
                ticketEmbed
            ],

            components: [
                ticketButtons
            ]
        });


    } catch (error) {

        console.error(
            '❌ Napaka pri pošiljanju sporočila v ticket:'
        );

        console.error(error);
    }


    // ==================================================
    // POTRDITEV UPORABNIKU
    // ==================================================

    await interaction.editReply({

        content:
            `✅ Vaš **${title}** ticket je bil ustvarjen: ${ticketChannel}`
    });


    console.log(
        `✅ ${user.tag} je odprl ${title}: #${ticketChannel.name}`
    );
}


// ======================================================
// DODAJ OSEBO - USER SELECT
// ======================================================

async function showUserSelect(interaction) {

    if (!isTicketChannel(interaction.channel)) {

        await interaction.reply({

            content:
                '❌ Ta kanal ni ticket.',

            flags:
                MessageFlags.Ephemeral
        });


        return;
    }


    const userSelect =
        new UserSelectMenuBuilder()

            .setCustomId(
                'ticket_add_user_select'
            )

            .setPlaceholder(
                'Izberi osebo'
            )

            .setMinValues(1)

            .setMaxValues(1);


    const row =
        new ActionRowBuilder()

            .addComponents(
                userSelect
            );


    await interaction.reply({

        content:
            '➕ Izberi osebo, ki jo želiš dodati v ticket:',

        components: [
            row
        ],

        flags:
            MessageFlags.Ephemeral
    });
}


// ======================================================
// DODAJ IZBRANO OSEBO
// ======================================================

async function addSelectedUser(interaction) {

    const channel =
        interaction.channel;


    if (!isTicketChannel(channel)) {

        await interaction.update({

            content:
                '❌ Ta kanal ni ticket.',

            components: []
        });


        return;
    }


    const userId =
        interaction.values[0];


    // ==================================================
    // DOBI MEMBERJA
    // ==================================================

    let member;


    try {

        member =
            await interaction.guild.members.fetch(
                userId
            );


    } catch (error) {

        console.error(
            '❌ Napaka pri pridobivanju osebe:'
        );

        console.error(error);


        await interaction.update({

            content:
                '❌ Izbrane osebe ni bilo mogoče najti.',

            components: []
        });


        return;
    }


    // ==================================================
    // NE DODAJ BOTOV
    // ==================================================

    if (member.user.bot) {

        await interaction.update({

            content:
                '❌ Botov ni mogoče dodati v ticket.',

            components: []
        });


        return;
    }


    // ==================================================
    // PREVERI, ČE ŽE IMA DOSTOP
    // ==================================================

    const permissions =
        channel.permissionsFor(
            member
        );


    if (
        permissions &&
        permissions.has(
            PermissionFlagsBits.ViewChannel
        )
    ) {

        await interaction.update({

            content:
                `ℹ️ ${member} že ima dostop do tega ticketa.`,

            components: []
        });


        return;
    }


    // ==================================================
    // DODAJ DOSTOP
    // ==================================================

    try {

        await channel.permissionOverwrites.edit(

            member.id,

            {
                ViewChannel:
                    true,

                SendMessages:
                    true,

                ReadMessageHistory:
                    true,

                AttachFiles:
                    true,

                EmbedLinks:
                    true
            }
        );


    } catch (error) {

        console.error(
            '❌ Napaka pri dodajanju osebe:'
        );

        console.error(error);


        await interaction.update({

            content:
                '❌ Osebe ni bilo mogoče dodati. Bot potrebuje dovoljenje **Manage Channels**.',

            components: []
        });


        return;
    }


    // ==================================================
    // PRIVATE POTRDITEV
    // ==================================================

    await interaction.update({

        content:
            `✅ ${member} je bil uspešno dodan v ticket.`,

        components: []
    });


    // ==================================================
    // SPOROČILO V TICKET
    // ==================================================

    await channel.send({

        content:
            `➕ ${member} je bil dodan v ticket s strani ${interaction.user}.`,

        allowedMentions: {

            users: [
                member.id
            ]
        }
    });
}


// ======================================================
// POTRDITEV ZAPRTJA
// ======================================================

async function askCloseConfirmation(interaction) {

    if (!isTicketChannel(interaction.channel)) {

        await interaction.reply({

            content:
                '❌ Ta kanal ni ticket.',

            flags:
                MessageFlags.Ephemeral
        });


        return;
    }


    const confirmButton =
        new ButtonBuilder()

            .setCustomId(
                'confirm_close_ticket'
            )

            .setLabel(
                'POTRDI ZAPRTJE'
            )

            .setEmoji('🔒')

            .setStyle(
                ButtonStyle.Danger
            );


    const cancelButton =
        new ButtonBuilder()

            .setCustomId(
                'cancel_close_ticket'
            )

            .setLabel(
                'PREKLIČI'
            )

            .setStyle(
                ButtonStyle.Secondary
            );


    const row =
        new ActionRowBuilder()

            .addComponents(
                confirmButton,
                cancelButton
            );


    await interaction.reply({

        content:
            '⚠️ **Ali ste prepričani, da želite zapreti ticket?**',

        components: [
            row
        ],

        flags:
            MessageFlags.Ephemeral
    });
}


// ======================================================
// ZAPRI TICKET
// ======================================================

async function closeTicket(interaction) {

    const channel =
        interaction.channel;


    if (!isTicketChannel(channel)) {

        await interaction.update({

            content:
                '❌ Ta kanal ni ticket.',

            components: []
        });


        return;
    }


    // ==================================================
    // POTRDI INTERACTION
    // ==================================================

    await interaction.update({

        content:
            '🔒 Ticket se zapira in transcript se ustvarja...',

        components: []
    });


    const ticketData =
        getTicketData(
            channel.topic
        );


    // ==================================================
    // USTVARI TRANSCRIPT
    // ==================================================

    let transcriptBuffer = null;


    const transcriptFileName =
        `transcript-${channel.name}.txt`;


    try {

        const transcript =
            await createTranscript(
                channel
            );


        transcriptBuffer =
            Buffer.from(
                transcript,
                'utf8'
            );


    } catch (error) {

        console.error(
            '❌ Napaka pri ustvarjanju transcripta:'
        );

        console.error(error);
    }


    // ==================================================
    // LOG CHANNEL
    // ==================================================

    try {

        const logChannel =
            await client.channels.fetch(
                CONFIG.TICKET_LOG_CHANNEL
            );


        if (
            logChannel &&
            logChannel.isTextBased()
        ) {

            const typeNames = {

                pomoc:
                    'Pomoč',

                donacija:
                    'Donacija',

                bug:
                    'Bug'
            };


            // ==========================================
            // LOG EMBED
            // ==========================================

            const logEmbed =
                new EmbedBuilder()

                    .setTitle(
                        '🔒 TICKET ZAPRT'
                    )

                    .setDescription(
                        transcriptBuffer

                            ? '📝 Pogovor iz ticketa je shranjen v priloženem transcriptu.'

                            : '⚠️ Transcripta ni bilo mogoče ustvariti.'
                    )

                    .addFields(

                        {
                            name:
                                'Ticket',

                            value:
                                `#${channel.name}`,

                            inline:
                                true
                        },

                        {
                            name:
                                'Lastnik',

                            value:
                                ticketData.ownerId

                                    ? `<@${ticketData.ownerId}>`

                                    : 'Neznano',

                            inline:
                                true
                        },

                        {
                            name:
                                'Kategorija',

                            value:
                                typeNames[ticketData.type] ||
                                'Neznano',

                            inline:
                                true
                        },

                        {
                            name:
                                'Zaprl',

                            value:
                                `${interaction.user}`,

                            inline:
                                true
                        }
                    )

                    .setFooter({

                        text:
                            'SLOLINE Official • Ticket Logs'
                    })

                    .setTimestamp();


            const logMessage = {

                embeds: [
                    logEmbed
                ]
            };


            // ==========================================
            // DODAJ TXT
            // ==========================================

            if (transcriptBuffer) {

                const attachment =
                    new AttachmentBuilder(

                        transcriptBuffer,

                        {
                            name:
                                transcriptFileName
                        }
                    );


                logMessage.files = [
                    attachment
                ];
            }


            // ==========================================
            // POŠLJI LOG
            // ==========================================

            await logChannel.send(
                logMessage
            );
        }


    } catch (error) {

        console.error(
            '❌ Napaka pri ticket logu:'
        );

        console.error(error);
    }


    // ==================================================
    // IZBRIŠI TICKET
    // ==================================================

    setTimeout(async () => {

        try {

            await channel.delete(
                `Ticket zaprl ${interaction.user.tag}`
            );


        } catch (error) {

            console.error(
                '❌ Napaka pri brisanju ticketa:'
            );

            console.error(error);
        }

    }, 2000);
}


// ======================================================
// CREATE TRANSCRIPT
// ======================================================

async function createTranscript(channel) {

    const allMessages = [];

    let lastMessageId = null;


    // ==================================================
    // PREBERI VSA SPOROČILA
    // Discord vrne največ 100 naenkrat.
    // ==================================================

    while (true) {

        const options = {

            limit:
                100
        };


        if (lastMessageId) {

            options.before =
                lastMessageId;
        }


        const messages =
            await channel.messages.fetch(
                options
            );


        if (messages.size === 0) {

            break;
        }


        allMessages.push(
            ...messages.values()
        );


        lastMessageId =
            messages.last().id;


        if (messages.size < 100) {

            break;
        }
    }


    // ==================================================
    // NAJSTAREJŠE -> NAJNOVEJŠE
    // ==================================================

    allMessages.sort(

        (a, b) =>

            a.createdTimestamp -
            b.createdTimestamp
    );


    const lines = [];


    // ==================================================
    // TRANSCRIPT
    //
    // FORMAT:
    //
    // [15.09.2026 05:08:14]
    // username (USER ID): sporočilo
    //
    // ==================================================

    for (const message of allMessages) {

        const date =
            formatDate(
                message.createdAt
            );


        const username =
            message.author

                ? message.author.username

                : 'Neznan uporabnik';


        const userId =
            message.author

                ? message.author.id

                : 'UNKNOWN';


        let content =
            message.content || '';


        // ==================================================
        // SLIKE / CLIPI / DATOTEKE
        // ==================================================

        if (message.attachments.size > 0) {

            const attachments = [];


            for (
                const attachment
                of message.attachments.values()
            ) {

                attachments.push(
                    attachment.url
                );
            }


            if (content) {

                content +=
                    ' ' +
                    attachments.join(' ');

            } else {

                content =
                    attachments.join(' ');
            }
        }


        // ==================================================
        // EMBEDI
        // ==================================================

        if (message.embeds.length > 0) {

            const embedTexts = [];


            for (
                const embed
                of message.embeds
            ) {

                if (embed.title) {

                    embedTexts.push(
                        embed.title
                    );
                }


                if (embed.description) {

                    embedTexts.push(
                        embed.description
                    );
                }
            }


            if (embedTexts.length > 0) {

                const embedContent =
                    embedTexts.join(' ');


                if (content) {

                    content +=
                        ' ' +
                        embedContent;

                } else {

                    content =
                        embedContent;
                }
            }
        }


        // ==================================================
        // PRAZNO SPOROČILO
        // ==================================================

        if (!content) {

            content =
                '[brez besedila]';
        }


        // ==================================================
        // ODSTRANI PRELOME VRSTIC IZ SPOROČILA
        // ==================================================

        content =
            content

                .replace(
                    /\r?\n/g,
                    ' '
                )

                .replace(
                    /\s+/g,
                    ' '
                )

                .trim();


        // ==================================================
        // KONČNA VRSTICA
        // ==================================================

        lines.push(
            `[${date}] ${username} (${userId}): ${content}`
        );
    }


    return lines.join('\n');
}


// ======================================================
// FORMAT DATUMA
// ======================================================

function formatDate(date) {

    const formatter =
        new Intl.DateTimeFormat(

            'sl-SI',

            {
                timeZone:
                    'Europe/Ljubljana',

                day:
                    '2-digit',

                month:
                    '2-digit',

                year:
                    'numeric',

                hour:
                    '2-digit',

                minute:
                    '2-digit',

                second:
                    '2-digit',

                hour12:
                    false
            }
        );


    const parts =
        formatter.formatToParts(
            date
        );


    const get =
        type =>

            parts.find(
                part =>
                    part.type === type
            )?.value || '';


    // TOČNO:
    // 15.09.2026 05:06:43

    return (
        `${get('day')}.` +
        `${get('month')}.` +
        `${get('year')} ` +
        `${get('hour')}:` +
        `${get('minute')}:` +
        `${get('second')}`
    );
}


// ======================================================
// PREVERI, ČE JE TICKET
// ======================================================

function isTicketChannel(channel) {

    if (!channel) {

        return false;
    }


    if (
        channel.type !==
        ChannelType.GuildText
    ) {

        return false;
    }


    if (!channel.topic) {

        return false;
    }


    return (

        channel.topic.includes(
            'ticket-owner:'
        )

        &&

        channel.topic.includes(
            'ticket-type:'
        )
    );
}


// ======================================================
// DOBI PODATKE IZ TOPICA
// ======================================================

function getTicketData(topic) {

    const data = {

        ownerId:
            null,

        type:
            null
    };


    if (!topic) {

        return data;
    }


    const ownerMatch =
        topic.match(
            /ticket-owner:(\d+)/
        );


    const typeMatch =
        topic.match(
            /ticket-type:([a-z]+)/
        );


    if (ownerMatch) {

        data.ownerId =
            ownerMatch[1];
    }


    if (typeMatch) {

        data.type =
            typeMatch[1];
    }


    return data;
}


// ======================================================
// CLEAN CHANNEL NAME
// ======================================================

function cleanChannelName(name) {

    const cleaned =
        name

            .toLowerCase()

            .replace(
                /[^a-z0-9-_]/g,
                '-'
            )

            .replace(
                /-+/g,
                '-'
            )

            .replace(
                /^[-_]+|[-_]+$/g,
                ''
            )

            .substring(
                0,
                90
            );


    return cleaned || 'ticket';
}


// ======================================================
// LOGIN
// ======================================================

client.login(
    process.env.DISCORD_TOKEN
);