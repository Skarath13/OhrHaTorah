/**
 * Public guide to Shabbat and the major appointed times on /holidays.
 *
 * Practice and dates follow normative Jewish observance outside Israel, matching the
 * congregation's commitment to "customs, traditions, and halachic practices preserved
 * within normative Judaism" (src/data/congregationIdentity.ts). Brit Chadashah notes cite
 * the passage directly and stay within the congregation's approved affirmations.
 */
export type HolidayGuideEntry = {
    readonly id: string;
    readonly title: string;
    readonly hebrew: string;
    readonly when: string;
    /** Short Hebrew date for the calendar-order ribbon. */
    readonly day?: string;
    readonly season: string;
    readonly sources: string;
    readonly about: readonly string[];
    readonly messiah?: string;
};

export type HolidaySeason = {
    readonly id: string;
    readonly title: string;
    readonly months: string;
    readonly entries: readonly HolidayGuideEntry[];
};

export const shabbatGuide: HolidayGuideEntry = {
    id: 'shabbat',
    title: 'Shabbat',
    hebrew: 'שַׁבָּת',
    when: 'Every week, Friday sunset to Saturday nightfall',
    season: 'Weekly',
    sources: 'Genesis 2:2–3 · Exodus 20:8–11 · Leviticus 23:3',
    about: [
        'Shabbat is the first appointed time named in Leviticus 23. We cease from work, light candles, bless wine and challah, and gather for prayer and Torah. Shabbat remembers creation (Exodus 20:11) and the redemption from Egypt (Deuteronomy 5:15), and Torah calls it a lasting sign of the covenant between God and Israel (Exodus 31:16–17).',
    ],
    messiah: 'Yeshua went to the synagogue on Shabbat “as was his custom” and read from the prophets (Luke 4:16), and he called himself Lord of the Sabbath (Mark 2:28).',
};

export const holidaySeasons: readonly HolidaySeason[] = [
    {
        id: 'fall',
        title: 'Fall holy days',
        months: 'Tishrei · September and October',
        entries: [
            {
                id: 'rosh-hashanah',
                title: 'Rosh HaShanah · Yom Teruah',
                hebrew: 'רֹאשׁ הַשָּׁנָה',
                when: '1–2 Tishrei',
                season: 'September or October',
                sources: 'Leviticus 23:23–25 · Numbers 29:1–6',
                about: [
                    'Torah calls the first day of the seventh month Yom Teruah, a day of shofar blasts and holy assembly. Jewish tradition keeps it as Rosh HaShanah, the head of the year, when we proclaim God as King and Judge of all creation. Apples dipped in honey express our hope for a sweet year.',
                    'Rosh HaShanah opens the Yamim Noraim (Days of Awe), ten days of teshuvah (repentance) that lead to Yom Kippur.',
                ],
                messiah: 'The Brit Chadashah (New Covenant) speaks of a trumpet blast at the resurrection of the dead and the coming of Messiah (1 Corinthians 15:52, 1 Thessalonians 4:16).',
            },
            {
                id: 'yom-kippur',
                title: 'Yom Kippur',
                hebrew: 'יוֹם כִּפּוּר',
                when: '10 Tishrei',
                season: 'September or October',
                sources: 'Leviticus 16 · Leviticus 23:26–32',
                about: [
                    'The Day of Atonement is the holiest day of the Jewish year. We fast for about 25 hours, from before sunset until after nightfall, and pray for forgiveness as individuals and as a people. Kol Nidre opens the evening. Neilah, the closing prayer, ends the day with a final long blast of the shofar.',
                ],
                messiah: 'We affirm the atoning death and resurrection of Yeshua. The book of Hebrews reads his atonement in light of the high priest’s service on this day (Hebrews 9:11–12), and the prophets look toward Israel’s national repentance and cleansing (Zechariah 12:10, 13:1).',
            },
            {
                id: 'sukkot',
                title: 'Sukkot',
                hebrew: 'סֻכּוֹת',
                when: '15–21 Tishrei',
                season: 'September or October',
                sources: 'Leviticus 23:33–43 · Deuteronomy 16:13–15',
                about: [
                    'The Festival of Tabernacles is called the Season of Our Rejoicing. Families build a sukkah, a temporary booth, and eat in it for seven days to remember that God sheltered Israel in the wilderness (Leviticus 23:42–43). We wave the four species, the palm branch (lulav), citron (etrog), myrtle, and willow, and give thanks for the harvest.',
                ],
                messiah: 'Yeshua went up to Jerusalem for Sukkot and taught in the Temple courts (John 7). Zechariah 14:16 looks ahead to the nations going up to Jerusalem year by year to keep the festival.',
            },
            {
                id: 'shemini-atzeret',
                title: 'Shemini Atzeret & Simchat Torah',
                hebrew: 'שִׂמְחַת תּוֹרָה',
                when: '22–23 Tishrei',
                season: 'October',
                sources: 'Leviticus 23:36 · Numbers 29:35',
                about: [
                    'Shemini Atzeret, the Eighth Day of Assembly, is its own holy day following the seven days of Sukkot, and the season’s prayer for rain begins. Simchat Torah, Rejoicing in the Torah, completes the yearly cycle of Torah readings at the end of Deuteronomy and begins again at Genesis, with singing and dancing as the scrolls are carried.',
                    'In Israel both fall on one day. Outside Israel, Simchat Torah is the following day. We celebrate them together in one gathering.',
                ],
            },
        ],
    },
    {
        id: 'winter',
        title: 'Winter',
        months: 'Kislev and Adar · December to March',
        entries: [
            {
                id: 'hanukkah',
                title: 'Hanukkah',
                hebrew: 'חֲנֻכָּה',
                when: 'Eight nights from 25 Kislev',
                day: '25 Kislev',
                season: 'December',
                sources: '1 Maccabees 4:36–59 · John 10:22–23',
                about: [
                    'The Festival of Lights is also called the Feast of Dedication. In 164 BCE the Maccabees retook Jerusalem from Seleucid Greek rulers who had defiled the Temple and outlawed Torah observance, and they rededicated the Temple to God. The Talmud remembers oil that lasted eight days (Shabbat 21b). We light the hanukkiah, adding a candle each night, and remember the courage to stay faithful under pressure to abandon the covenant.',
                ],
                messiah: 'Yeshua was in the Temple, walking in Solomon’s Colonnade, at the Feast of Dedication (John 10:22–23).',
            },
            {
                id: 'purim',
                title: 'Purim',
                hebrew: 'פּוּרִים',
                when: '14 Adar (Adar II in a leap year)',
                day: '14 Adar',
                season: 'February or March',
                sources: 'Esther 9:20–32',
                about: [
                    'Purim celebrates the deliverance of the Jewish people in Persia from Haman’s plot to destroy them. We read the Megillah, the scroll of Esther, aloud and drown out Haman’s name with noise. We send gifts of food to friends, give to the poor, and share a festive meal.',
                    'God’s name never appears in Esther, yet the story shows His hidden faithfulness in preserving His people.',
                ],
            },
        ],
    },
    {
        id: 'spring',
        title: 'Spring festivals',
        months: 'Nisan and Sivan · March to June',
        entries: [
            {
                id: 'pesach',
                title: 'Pesach · Passover',
                hebrew: 'פֶּסַח',
                when: '15–22 Nisan',
                season: 'March or April',
                sources: 'Exodus 12 · Leviticus 23:4–8',
                about: [
                    'Passover remembers God’s redemption of Israel from slavery in Egypt. At the seder we retell the Exodus from the Haggadah, eat matzah and bitter herbs, and drink four cups of wine, so that each generation sees itself as if it had come out of Egypt. For the eight days of the festival we remove chametz (leaven) from our homes.',
                ],
                messiah: 'Yeshua kept Passover with his talmidim (disciples) on the night before his death, and at that table spoke of the cup of the New Covenant in his blood (Luke 22:15–20). Paul calls Messiah our Passover lamb (1 Corinthians 5:7).',
            },
            {
                id: 'shavuot',
                title: 'Shavuot',
                hebrew: 'שָׁבוּעוֹת',
                when: '6–7 Sivan',
                season: 'May or June',
                sources: 'Leviticus 23:15–21 · Deuteronomy 16:9–12',
                about: [
                    'The Feast of Weeks comes seven weeks after Passover, at the end of the counting of the Omer. Torah names it the festival of the wheat harvest and first fruits (Exodus 34:22). Jewish tradition also celebrates the giving of the Torah at Sinai, and many study through the night. We read the book of Ruth, and dairy foods are customary.',
                ],
                messiah: 'On Shavuot in Jerusalem, the Ruach HaKodesh (Holy Spirit) was poured out on Yeshua’s followers, and about three thousand people came to faith (Acts 2).',
            },
        ],
    },
];
