import { FFOZ_SOURCE, getFfozReading } from './ffozReadings.ts';

export const CHAYYEI_YESHUA_SOURCE = {
    name: 'Chayyei Yeshua Three-Year Besorah Reading Cycle',
    publisher: 'Messianic Jewish Rabbinical Council',
    url: 'https://www.ourrabbis.org/main/resources/chayyei-yeshua-reading-cycle'
} as const;

type CycleReadings = readonly [yearA: string, yearB: string, yearC: string];

const cycle = (yearA: string, yearB: string, yearC: string): CycleReadings => [yearA, yearB, yearC];
const same = (reading: string): CycleReadings => cycle(reading, reading, reading);

const readings: Record<string, CycleReadings> = {
    Bereshit: same('John 1:1–18'),
    Noach: cycle('Matthew 1:1–17', 'Luke 1:26–38', 'John 1:19–34'),
    'Lech-Lecha': cycle('Matthew 1:18–25', 'Luke 2:1–20', 'John 1:35–51'),
    Vayera: cycle('Matthew 2:1–12', 'Luke 2:21–40', 'John 2:1–12'),
    'Chayei Sara': cycle('Matthew 3:1–12', 'Luke 3:1–17', 'John 2:13–25'),
    Toldot: cycle('Matthew 3:13–4:11', 'Luke 3:18–38', 'John 3:1–21'),
    Vayetzei: cycle('Mark 1:14–28', 'Luke 4:1–15', 'John 4:5–30'),
    Vayishlach: cycle('Mark 1:29–45', 'Luke 4:16–30', 'John 4:31–42'),
    Vayeshev: cycle('Matthew 5:1–16', 'Luke 4:31–44', 'John 4:43–54'),
    Miketz: cycle('Matthew 5:17–26', 'Luke 5:1–11', 'John 5:1–15'),
    Vayigash: cycle('Matthew 5:27–48', 'Luke 5:12–26', 'John 5:16–29'),
    Vayechi: cycle('Matthew 6:1–18', 'Luke 5:27–39', 'John 5:30–47'),
    Shemot: cycle('Matthew 6:19–34', 'Luke 6:1–16', 'John 6:1–15'),
    Vaera: cycle('Matthew 7:1–12', 'Luke 6:17–38', 'John 6:16–29'),
    Bo: cycle('Matthew 7:13–29', 'Luke 7:1–17', 'John 6:30–51'),
    Beshalach: cycle('Mark 2:1–12', 'Luke 7:18–35', 'John 6:52–71'),
    Yitro: cycle('Matthew 11:2–19', 'Luke 7:36–50', 'John 7:1–13'),
    Mishpatim: cycle('Matthew 11:20–30', 'Luke 8:1–21', 'John 7:14–24'),
    Terumah: cycle('Matthew 13:1–23', 'Luke 8:22–39', 'John 7:25–36'),
    Tetzaveh: cycle('Matthew 14:12–33', 'Luke 8:40–56', 'John 7:37–52'),
    'Ki Tisa': cycle('Matthew 15:1–20', 'Luke 9:1–17', 'John 8:1–11'),
    'Vayakhel-Pekudei': cycle('Matthew 15:21–39', 'Luke 9:18–36', 'John 8:12–30'),
    Vayakhel: cycle('Matthew 15:21–28', 'Luke 9:18–27', 'John 8:12–20'),
    Pekudei: cycle('Matthew 15:29–39', 'Luke 9:28–36', 'John 8:21–30'),
    Vayikra: cycle('Matthew 16:1–20', 'Luke 10:25–42', 'John 8:31–47'),
    Tzav: cycle('Matthew 16:21–17:13', 'Luke 11:1–13', 'John 8:48–59'),
    Shemini: cycle('Matthew 17:14–27', 'Luke 12:13–34', 'John 9:1–17'),
    'Tazria-Metzora': cycle('Matthew 18:1–18', 'Luke 13:1–17', 'John 9:18–41'),
    Tazria: cycle('Matthew 18:1–18', 'Luke 13:1–9', 'John 9:18–23'),
    Metzora: cycle('Matthew 18:19–35', 'Luke 13:10–17', 'John 9:24–41'),
    'Acharei Mot-Kedoshim': cycle('Matthew 19:1–12', 'Luke 14:1–24', 'John 10:1–21'),
    'Acharei Mot': cycle('Matthew 19:1–12', 'Luke 14:1–11', 'John 10:1–10'),
    Kedoshim: cycle('Matthew 19:13–30', 'Luke 14:12–24', 'John 10:11–21'),
    Emor: cycle('Matthew 20:1–19', 'Luke 14:25–33', 'John 10:22–42'),
    'Behar-Bechukotai': cycle('Matthew 21:1–17', 'Luke 16:1–17', 'John 11:1–37'),
    Behar: cycle('Matthew 21:1–17', 'Luke 16:1–9', 'John 11:1–16'),
    Bechukotai: cycle('Matthew 21:18–27', 'Luke 16:10–17', 'John 11:17–37'),
    Bamidbar: cycle('Mark 12:28–34', 'Luke 16:19–31', 'John 11:38–57'),
    Nasso: cycle('Mark 13:14–27', 'Luke 18:1–17', 'John 12:1–26'),
    "Beha'alotcha": cycle('Mark 14:1–11', 'Luke 18:31–43', 'John 13:1–20'),
    Shelach: cycle('Matthew 26:17–30', 'Luke 19:1–28', 'John 14:1–24'),
    Korach: cycle('Mark 14:32–50', 'Luke 19:29–48', 'John 15:1–17'),
    'Chukat-Balak': cycle('Mark 14:53–72', 'Luke 20:1–18', 'John 16:12–33'),
    Chukat: cycle('Mark 14:53–65', 'Luke 20:1–8', 'John 16:12–28'),
    Balak: cycle('Mark 14:66–72', 'Luke 20:9–18', 'John 16:29–33'),
    Pinchas: cycle('Mark 15:1–15', 'Luke 22:7–20', 'John 17:1–26'),
    'Matot-Masei': cycle('Matthew 27:33–44', 'Luke 23:33–43', 'John 18:28–19:16'),
    Matot: cycle('Matthew 27:27–32', 'Luke 23:26–32', 'John 18:1–27'),
    Masei: cycle('Matthew 27:33–44', 'Luke 23:33–43', 'John 18:28–19:16'),
    Devarim: cycle('Matthew 27:45–61', 'Luke 23:44–56', 'John 19:17–41'),
    Vaetchanan: cycle('Matthew 27:62–28:10', 'Luke 24:1–11', 'John 20:1–18'),
    Eikev: same('Luke 24:13–32'),
    "Re'eh": same('Luke 24:33–49'),
    Shoftim: same('John 20:19–29'),
    'Ki Teitzei': same('John 21:1–25'),
    'Ki Tavo': same('1 Corinthians 15:1–11'),
    'Nitzavim-Vayeilech': same('Matthew 28:16–20'),
    Nitzavim: same('Matthew 28:16–20'),
    Vayeilech: same('Matthew 28:16–20'),
    "Ha'azinu": same('Romans 15:7–13'),
    'Rosh Hashana I (on Shabbat)': same('Romans 8:31–39'),
    'Rosh Hashana II (on Shabbat)': same('1 Thessalonians 4:13–18'),
    'Shabbat Shuva': same('Luke 15:11–32'),
    'Shabbat Sukkot': same('John 7:2–24'),
    'Shmini Atzeret': same('Romans 11:25–36'),
    'Shabbat Chanukah I': same('John 10:22–42'),
    'Pesach Shabbat Chol ha-Moed': same('Revelation 5:1–14')
};

const normalize = (value: string): string => value
    .normalize('NFKD')
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const normalizedReadings = new Map(
    Object.entries(readings).map(([name, value]) => [normalize(name), value])
);

export const getChayyeiYeshuaCycleYear = (hebrewYear: number): 'A' | 'B' | 'C' | null => {
    if (!Number.isInteger(hebrewYear) || hebrewYear < 1) return null;
    const index = ((hebrewYear - 5786) % 3 + 3) % 3;
    return (['A', 'B', 'C'] as const)[index];
};

export const getChayyeiYeshuaReading = (
    parashah: string,
    hebrewYear: number
): { reading: string; cycleYear: 'A' | 'B' | 'C' } | null => {
    const cycleYear = getChayyeiYeshuaCycleYear(hebrewYear);
    const entry = normalizedReadings.get(normalize(parashah));
    if (!cycleYear || !entry) return null;
    const index = cycleYear === 'A' ? 0 : cycleYear === 'B' ? 1 : 2;
    return { reading: entry[index], cycleYear };
};

export type PreferredBritReading = {
    reading: string;
    source: 'ffoz' | 'mjrc';
    sourceName: string;
    sourceUrl: string;
    cycleYear?: 'A' | 'B' | 'C';
};

export const getPreferredBritReading = (
    parashah: string,
    hebrewYear?: number
): PreferredBritReading | null => {
    const ffozReading = getFfozReading(parashah);
    if (ffozReading) {
        return {
            reading: ffozReading.reading,
            source: 'ffoz',
            sourceName: FFOZ_SOURCE.publisher,
            sourceUrl: ffozReading.sourceUrl
        };
    }

    const mjrcReading = hebrewYear
        ? getChayyeiYeshuaReading(parashah, hebrewYear)
        : null;
    if (!mjrcReading) return null;

    return {
        reading: mjrcReading.reading,
        source: 'mjrc',
        sourceName: CHAYYEI_YESHUA_SOURCE.name,
        sourceUrl: CHAYYEI_YESHUA_SOURCE.url,
        cycleYear: mjrcReading.cycleYear
    };
};
