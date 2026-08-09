export const FFOZ_SOURCE = {
    name: 'First Fruits of Zion Annual Gospel Reading Schedule',
    publisher: 'First Fruits of Zion',
    url: 'https://ffoz.org/torahportions/',
    retrievedAt: '2026-08-09'
} as const;

type FfozReadingEntry = {
    names: readonly string[];
    reading: string;
    slug: string;
};

export type FfozReading = {
    reading: string;
    sourceUrl: string;
};

const entries: readonly FfozReadingEntry[] = [
    { names: ['Bereshit', "B'reisheet"], reading: 'John 1:1-17', slug: 'breisheet' },
    { names: ['Noach'], reading: 'Luke 17:20-27', slug: 'noach' },
    { names: ['Lech-Lecha', 'Lech Lecha'], reading: 'John 8:51-58', slug: 'lech-lecha' },
    { names: ['Vayera'], reading: 'Luke 17:28-37', slug: 'vayera' },
    { names: ['Chayei Sara', 'Chayei Sarah'], reading: 'John 4:3-14', slug: 'chayei-sarah' },
    { names: ['Toldot'], reading: 'Matthew 10:21-38', slug: 'toldot' },
    { names: ['Vayetzei', 'Vayetze'], reading: 'John 1:41-51', slug: 'vayetze' },
    { names: ['Vayishlach'], reading: 'Matthew 2:13-23', slug: 'vayishlach' },
    { names: ['Vayeshev'], reading: 'Matthew 1:18-25', slug: 'vayeshev' },
    { names: ['Miketz'], reading: 'Luke 24:13-29', slug: 'miketz' },
    { names: ['Vayigash'], reading: 'Luke 24:30-48', slug: 'vayigash' },
    { names: ['Vayechi'], reading: 'John 13:1-19', slug: 'vayechi' },
    { names: ['Shemot'], reading: 'Matthew 2:1-12', slug: 'shemot' },
    { names: ['Vaera', "Va'era"], reading: 'Luke 11:14-22', slug: 'vaera' },
    { names: ['Bo'], reading: 'John 19:31-37', slug: 'bo' },
    { names: ['Beshalach'], reading: 'Matthew 14:22-33', slug: 'beshalach' },
    { names: ['Yitro'], reading: 'Matthew 19:16-26', slug: 'yitro' },
    { names: ['Mishpatim'], reading: 'Matthew 26:20-30', slug: 'mishpatim' },
    { names: ['Terumah'], reading: 'Mark 12:35-44', slug: 'terumah' },
    { names: ['Tetzaveh'], reading: 'Matthew 5:13-20', slug: 'tetzaveh' },
    { names: ['Ki Tisa'], reading: 'Mark 9:1-10', slug: 'ki-tisa' },
    { names: ['Vayakhel', "Vayak'hel"], reading: 'Matthew 12:1-13', slug: 'vayakhel' },
    { names: ['Pekudei'], reading: 'Luke 16:1-13', slug: 'pekudei' },
    { names: ['Vayakhel-Pekudei', "Vayak'hel-Pekudei"], reading: 'Luke 16:1-13', slug: 'vayakhel-pekudei' },
    { names: ['Vayikra'], reading: 'Matthew 5:23-30', slug: 'vayikra' },
    { names: ['Tzav'], reading: 'Matthew 9:10-17', slug: 'tzav' },
    { names: ['Shemini', "Sh'mini"], reading: 'Matthew 3:11-17', slug: 'shemini' },
    { names: ['Tazria'], reading: 'Luke 2:22-33', slug: 'tazria' },
    { names: ['Metzora'], reading: 'Mark 1:35-45', slug: 'metzora' },
    { names: ['Tazria-Metzora'], reading: 'Mark 1:35-45', slug: 'tazria-metzora' },
    { names: ['Acharei Mot'], reading: 'Matthew 15:10-20', slug: 'acharei-mot' },
    { names: ['Kedoshim'], reading: 'Mark 12:28-34', slug: 'kedoshim' },
    { names: ['Acharei Mot-Kedoshim'], reading: 'Mark 12:28-34', slug: 'acharei-mot-kedoshim' },
    { names: ['Emor'], reading: 'Matthew 26:59-66, 64', slug: 'emor' },
    { names: ['Behar'], reading: 'Luke 4:14-22', slug: 'behar' },
    { names: ['Bechukotai'], reading: 'Matthew 16:20-28', slug: 'bechukotai' },
    { names: ['Behar-Bechukotai'], reading: 'Matthew 16:20-28', slug: 'behar-bechukotai' },
    { names: ['Bamidbar'], reading: 'Matthew 4:1-17', slug: 'bamidbar' },
    { names: ['Nasso', 'Naso'], reading: 'Luke 1:11-20', slug: 'nasso' },
    { names: ["Beha'alotcha", 'Behaalotcha'], reading: 'Matthew 14:14-21', slug: 'behaalotcha' },
    { names: ['Shelach'], reading: 'Matthew 10:1-14', slug: 'shelach' },
    { names: ['Korach'], reading: 'Matthew 26:13-24', slug: 'korach' },
    { names: ['Chukat'], reading: 'John 2:1-12', slug: 'chukat' },
    { names: ['Balak'], reading: 'Matthew 21:1-11', slug: 'balak' },
    { names: ['Chukat-Balak'], reading: 'Matthew 21:1-11', slug: 'chukat-balak' },
    { names: ['Pinchas'], reading: 'Luke 13:1-10', slug: 'pinchas' },
    { names: ['Matot', 'Mattot'], reading: 'Luke 13:1-10', slug: 'mattot' },
    { names: ['Masei', 'Massei'], reading: 'Mark 11:12-25', slug: 'massei' },
    { names: ['Matot-Masei', 'Mattot-Massei'], reading: 'Mark 11:12-25', slug: 'mattot-massei' },
    { names: ['Devarim'], reading: 'Matthew 24:1-22', slug: 'devarim' },
    { names: ['Vaetchanan', "Va'etchanan"], reading: 'Luke 3:2-15', slug: 'vaetchanan' },
    { names: ['Eikev', 'Ekev'], reading: 'Matthew 16:13-20', slug: 'ekev' },
    { names: ["Re'eh", 'Reeh'], reading: 'John 6:35-51', slug: 'reeh' },
    { names: ['Shoftim'], reading: 'John 14:9-20', slug: 'shoftim' },
    { names: ['Ki Teitzei', 'Ki Tetze'], reading: 'Matthew 24:29-42', slug: 'ki-tetze' },
    { names: ['Ki Tavo'], reading: 'Matthew 4:13-24', slug: 'ki-tavo' },
    { names: ['Nitzavim'], reading: 'John 12:41-50', slug: 'nitzavim' },
    { names: ['Vayeilech', 'Vayelech'], reading: 'Matthew 21:9-17', slug: 'vayelech' },
    { names: ['Nitzavim-Vayeilech', 'Nitzavim-Vayelech'], reading: 'John 12:41-50', slug: 'nitzavim-vayelech' },
    { names: ["Ha'azinu", 'Haazinu'], reading: 'John 6:26-35', slug: 'haazinu' },
    { names: ["V'Zot HaBerachah", 'Vezot Haberachah', "Vezot ha'Bracha"], reading: 'Acts 1:1-14', slug: 'vezot-habracha' },
    { names: ['Rosh Hashana I', 'Rosh Hashana I (on Shabbat)', 'Rosh HaShanah I'], reading: 'Luke 1:39-55', slug: 'rosh-hashanah' },
    { names: ['Rosh Hashana II', 'Rosh Hashana II (on Shabbat)', 'Rosh HaShanah II'], reading: 'Matthew 24:29-36', slug: 'rosh-hashana-2' },
    { names: ['Yom Kippur'], reading: 'Matthew 25:31-46', slug: 'yom-kippur' },
    { names: ['Sukkot I', 'Sukkot I (on Shabbat)', 'Shabbat Sukkot'], reading: 'Luke 2:1-20', slug: 'sukkot' },
    { names: ['Sukkot II'], reading: 'John 7:1-10', slug: 'sukkot-2' },
    { names: ['Shabbat Chol HaMoed Sukkot', 'Sukkot Shabbat Chol ha-Moed'], reading: 'John 7:31-43', slug: 'sukkot-shabbat-chol-hamoed' },
    { names: ['Shmini Atzeret', "Sh'mini Atzeret"], reading: 'Luke 2:21-32', slug: 'shemini-atzeret' },
    { names: ['Simchat Torah'], reading: 'Acts 1:1-14', slug: 'simchat-torah' },
    { names: ['Pesach I'], reading: 'John 19:31-20:1', slug: 'pesach' },
    { names: ['Pesach II'], reading: 'Mark 16:1-8', slug: 'pesach-2' },
    { names: ['Pesach VII'], reading: 'John 20:1-14', slug: 'shevii-shel-pesach' },
    { names: ['Pesach VIII'], reading: 'John 20:15-20', slug: 'shemini-shel-pesach' },
    { names: ['Pesach Shabbat Chol ha-Moed', 'Shabbat Chol HaMoed Pesach'], reading: 'Luke 23:42-56', slug: 'pesach-shabbat-chol-hamoed' },
    { names: ["Shavuot I", "Shavu'ot I"], reading: 'Acts 2:1-21', slug: 'shavuot' },
    { names: ["Shavuot II", "Shavu'ot II"], reading: 'Acts 2:21-42', slug: 'sheni-shel-shavuot' },
    { names: ["Shavuot II (on Shabbat)", "Shavu'ot II (on Shabbat)"], reading: 'Acts 2:21-42', slug: 'sheni-shel-shavuot-shabbat' }
];

const normalize = (value: string): string => value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[’‘'`]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();

const readingsByName = new Map<string, FfozReading>();

for (const entry of entries) {
    const reading = {
        reading: entry.reading,
        sourceUrl: `${FFOZ_SOURCE.url}parashah/${entry.slug}`
    };
    for (const name of entry.names) readingsByName.set(normalize(name), reading);
}

export const getFfozReading = (parashah: string): FfozReading | null => (
    readingsByName.get(normalize(parashah)) || null
);
