export type IdentityStatement = {
    readonly id: string;
    readonly text: string;
};

export type CoreValueGroup = {
    readonly id: string;
    readonly heading: string;
    readonly values: readonly string[];
};

export type HomepageIdentityPreviewItem = {
    readonly title: string;
    readonly description: string;
};

/**
 * Public-facing identity copy approved by congregational leadership.
 *
 * Keep this module authoritative: public summaries may select from this language,
 * but should not soften or replace its theological vocabulary.
 */
export const officialIdentityStatement =
    'Kehilat Ohr HaTorah is a Messianic Jewish congregation (UMJC member) committed to Torah Covenant faithfulness, to Jewish community life and tradition, to the unity of Jewish and non-Jewish members, and to faith in the atoning death and resurrection of Yeshua, our coming Messiah and restorer of Israel.';

export const visionAndPurposeParagraphs = [
    'We are committed to encouraging and supporting one another in living lives worthy of our calling in the full Besorah (good news) of Messiah Yeshua. Together, we as individuals and families are committed to growing in our love for God and for one another, growing in our passion for serving the needs of our Jewish and local communities in the love of God, and to growing in our commitment to Jewish covenant faithfulness.',
    'As a unified and loving bilateral community of committed Jewish and non-Jewish members, we proclaim in unison the Besorah (good news), that God has atoned for our sins, has brought us into new life, and has merited full restoration of His covenant Jewish people – all through the death and resurrection of Messiah Yeshua. In His merit, we are being dramatically gifted and empowered by the Ruach HaKodesh (Holy Spirit) to proclaim the Besorah of Yeshua, to serve Him and to help heal the schism, the “parting of the ways,” between the wider covenant Jewish community and the largely non-Jewish followers of Yeshua.',
    'In His merit, the Kingdom of God will be fully realized for a restored, redeemed, and regathered Jewish people in the land of Israel at the return of Yeshua (Acts 1:6, 3:19-21). In that day – may it be soon – we will be joined by all of our Jewish people in welcoming our coming Messiah King (Psalm 118:26, Matthew 23:39).',
] as const;

export const coreCommitments: readonly IdentityStatement[] = [
    {
        id: 'covenant-fidelity',
        text: 'We are committed to worshiping the God of Israel in covenant fidelity according to the authoritative teachings of the Tanakh (Torah, Prophets, and Writings) and the Brit Chadashah (New Covenant). We enrich our worship through the collective wisdom of our people as we participate in the customs, traditions, and halachic practices preserved within normative Judaism.',
    },
    {
        id: 'jewish-repentance',
        text: 'We are committed to the essential collective pursuit of Jewish repentance and covenant faithfulness. Therefore, our congregational name bears the addendum “Messianic Synagogue.” “Messianic” highlights our continuing commitment to Yeshua as our Messiah while “Synagogue” clarifies our own congregation’s commitment to covenant faithfulness and connection to normative Judaism.',
    },
    {
        id: 'fullness-of-the-besorah',
        text: 'We are committed to proclaiming the fullness of the Besorah, the Good News (Gospel) of Yeshua. We affirm the finished work of His atoning death and bodily resurrection and the resultant inauguration of the Brit Chadashah (New Covenant) for the household of Israel (Jeremiah 31:33, Matthew 26:28). Yeshua’s atonement for sin profits all who receive Him as Messiah and ultimately culminates in the restoration of the Kingdom of God to our covenant Jewish people (Acts 1:6, 3:19-20, Luke 1:67-75).',
    },
    {
        id: 'welcoming-community',
        text: 'We are committed to building a faithful, welcoming, and loving synagogue community devoted to encouraging and equipping individuals and families for joyful service within our synagogue and within our wider Jewish and local communities.',
    },
    {
        id: 'restoration-of-israel',
        text: 'We are committed to praying daily for the peace and full restoration of the covenant Jewish people (Matthew 6:10, weekday Amidah) – the establishment of the Messianic reign in Israel which will expand throughout the entire world (Daniel 2:35, 44). We recognize this promise as essential to the full Besorah (good news).',
    },
    {
        id: 'besorah-to-israel-and-the-nations',
        text: 'We embrace the fullness of the Besorah (“Good News” or “Gospel”) to Israel and to the nations through the finished work of Yeshua’s atoning death and bodily resurrection – meriting the forgiveness of sin for all who receive Him (Acts 5:31). We are further promised that God will accomplish the full repentance and covenant faithfulness of our Jewish people – and with it – the full restoration of the Kingdom of God to our presently exiled people (Deuteronomy 30:1-4, Luke 1:67-75, Acts 1:6, Acts 3:19-21).',
    },
    {
        id: 'bilateral-community',
        text: 'We affirm the bilateral, variegated, nature of adat haMashiach (the Messiah’s community). As such, all non-Jewish members in Messiah are spiritually connected to the covenant Jewish community (Romans 11:24, Ephesians 2:12-13). Jewish members remain fully responsible to the covenants made with Israel (implied by Paul’s rule in I Corinthians 7:17-18) while non-Jewish members, having no call for Jewish conversion, bear a reduced covenant obligation as determined by the early Jerusalem Council (Acts 15:19-21, 27-29). We affirm the ruling in Acts 15 as a minimum starting point for Gentiles, fully expecting their maturing covenant observance for the sake of so-called table fellowship and personal spiritual growth.',
    },
    {
        id: 'distinct-callings-and-unity',
        text: 'We affirm and honor the distinct identity and calling of both Jewish and non-Jewish members of our community equally – supporting their differing covenant obligations (Acts 15:19-21, 27-29) while also supporting the absolute unity of all believers within the bilateral community of Messiah. The resulting variegated community of Jewish and non-Jewish members is articulated clearly in Rav Shaul’s “rule” for all congregations in Messiah (1 Corinthians 7:17-18). The consequence of 2,000 years of neglecting Paul’s rule has been the emergence of a thoroughly Gentile “one new man” that Paul never intended (Ephesians 2:15).',
    },
    {
        id: 'covenant-community',
        text: 'We affirm that the wider Jewish community continues to exist as the one and only covenant community – according to the terms of the Abrahamic, Torah, and Brit Chadashah covenants made with Israel exclusively (Jeremiah 31:33). The apostle Paul portrays non-Jewish individuals in Messiah as participating in the covenants when “grafted in” to the covenant community olive tree (Romans 11:17) and thereby becoming members of the “commonwealth” of Israel (Ephesians 2:12-13).',
    },
    {
        id: 'well-being-of-israel',
        text: 'We remain committed to the well-being and safety of the State of Israel. At all times, we offer up our faithful prayers along with our material and moral support.',
    },
    {
        id: 'meaningful-connections',
        text: 'We are committed to creating and maintaining meaningful connections and identity within both the Jewish community and the wider community of Messiah, promoting a relationship of peace and mutual blessing between the two.',
    },
    {
        id: 'addressing-supersessionism',
        text: 'We are committed to engaging in productive dialogue that addresses the error of supersessionism as well as residual theological supersessionism that continues within the wider community of Messiah and even within some Messianic congregations.',
    },
    {
        id: 'teaching-the-brit-chadashah',
        text: 'We are committed to teaching the Brit Chadashah within the context of the unchanging foundation of the Tanakh and with an understanding of Jewish teachings and perspectives utilized by Yeshua and his shlichim (שליחים apostles, emissaries) throughout the New Testament writings.',
    },
] as const;

export const coreValueGroups: readonly CoreValueGroup[] = [
    {
        id: 'individual-family-community-strength',
        heading: 'For Individual, Family, and Community Strength',
        values: [
            'We value every person as someone precious and valuable to God, made in his image.',
            'We value the nurturing of strong and healthy marriages and families, the core foundation of our community’s health.',
            'We value the unity and oneness of Jewish and non-Jewish members — male and female, wealthy and poor. All are treated with equal dignity and respect.',
            'We value first the pursuit of righteousness in our lives, both through right living and through the embracing of the gift of righteousness through Yeshua our Messiah.',
            'We value prayer in the Name of Yeshua our Messiah, knowing that He has merited for us great favor [חֵן] with our heavenly Father (John 14:13-14, 16:24-27).',
            'We value personal, congregational, and academic study and observance of the life-giving Word of God, implanted in our hearts by the Ruach haKodesh (Holy Spirit) for strength, growth and transformation.',
            'We value normative Judaism and thus commit ourselves to life-long learning, experience, and growth in the deep richness of Jewish life, thought, and traditions.',
            'We value the teaching and development of our children, the builders of our future, l’dor vador (לדור ודור).',
            'We value the learning of Hebrew, actively promoting and teaching both modern and biblical forms. We thereby enrich our knowledge of the Bible, nurture and preserve Jewish learning from generation to generation, enhance Jewish unity, and strengthen our connection to national Israel.',
        ],
    },
    {
        id: 'leadership-development',
        heading: 'Leadership Development',
        values: [
            'We value the principle of alignment, the need for each congregation, in its uniqueness, to ensure that leaders and emerging leaders are directed and moving toward a common vision, mission, and set of goals.',
            'We value team leadership and ministry as a means to promote personal growth, community growth, and healthy accountability for all.',
            'We value and encourage the commitment of every member to a lifestyle of spiritual growth and congregational service.',
            'We value and acknowledge that every member has gifts and abilities to be discovered, developed and deployed.',
            'We value the ongoing identification, training, and support of emerging leaders.',
            'We value a spirit of excellence that permeates every activity, recognizing that God is worthy of our best. While perfectionism is unhealthy and to be avoided, the spirit of excellence is a natural extension of our respect and love for God.',
        ],
    },
    {
        id: 'community-building-and-maasei-tovim',
        heading: 'Community Building and Maasei Tovim (good works)',
        values: [
            'We value congregational growth through the making of talmidim (disciples), through nurturing the ministry and growth of emerging leaders, and through all members deploying their many gifts and abilities on behalf of the community and in service to Messiah.',
            'We value genuine love and caring relationships, the foundation for unified healthy service within our congregations. We seek to reflect the godly attributes of love, compassion, forgiveness and patience for one another (Ephesians 5:1-2, Exodus 34:6-7). In His instructional prayer for his talmidim, Yeshua emphasized that when we (the covenant Jewish people) forgive others their wrongdoing, then we will be forgiven (Matthew 6:14-15). Thus, the exercise of ahavat chinam (אהבת חינם), unconditional love, is a necessary part of our national repentance, as sinat chinam (שׂנאת חנם), baseless hatred, is traditionally viewed as the root cause of our first century CE exile (Babylonian Talmud, Tractate Yoma 9b and Yerushalmi, Yoma 1:1).',
            'We value membership and participation with a community of congregations who embrace Messianic Judaism and covenant faithfulness, who recognize that we are stronger when part of a movement of God that is bigger than ourselves alone. Consequently, we are privileged to be a member of the Union of Messianic Jewish Congregations (UMJC).',
            'We value reproducing ourselves and being supportive of other emerging congregations who share our values.',
            'We value the pursuit of Tikkun Olam, the repairing (or at least improving) of the world. Thus, we value community service, acts of lovingkindness, humanitarian efforts, and unwavering support for all Jewish people in need, both within and outside the State of Israel. At the same time, we pray for and believe with complete faith that Messiah Yeshua will return to us – may it be soon – to save us from our enemies, to usher in lasting peace, and to restore Israel and the world through His Davidic Kingship (Luke 1:67-75).',
            'We value a deep commitment to the well-being and safety of the State of Israel. We offer her our daily prayers, as well as our material and moral support at all times.',
            'We value efforts to help heal the schism between the largely non-Jewish community of Messiah and the covenant Jewish community. The so-called “parting of the ways” between the two communities, beginning as early as the late first century C.E., widened over the following centuries until it was fully institutionalized by both the early (Gentile) Church and the wider Jewish community. We will pursue healing, improved relations, and reconnection until Yeshua’s return – when all will be reconciled through Him.',
        ],
    },
] as const;

export const homepageIdentityPreview: {
    readonly commitments: readonly HomepageIdentityPreviewItem[];
    readonly values: readonly HomepageIdentityPreviewItem[];
} = {
    commitments: [
        {
            title: 'Covenant Fidelity',
            description: 'We are committed to worshiping the God of Israel in covenant fidelity according to the authoritative teachings of the Tanakh and the Brit Chadashah.',
        },
        {
            title: 'A Loving Synagogue Community',
            description: 'We are committed to building a faithful, welcoming, and loving synagogue community that equips individuals and families for joyful service.',
        },
        {
            title: 'Peace and Mutual Blessing',
            description: 'We are committed to meaningful connection between the Jewish community and the wider community of Messiah, promoting peace and mutual blessing.',
        },
    ],
    values: [
        {
            title: 'Every Person',
            description: 'We value every person as someone precious and valuable to God, made in his image.',
        },
        {
            title: 'Jewish Life',
            description: 'We value life-long learning, experience, and growth in the deep richness of Jewish life, thought, and traditions.',
        },
        {
            title: 'Genuine Love',
            description: 'We value genuine love and caring relationships, the foundation for unified healthy service within our congregations.',
        },
        {
            title: 'Maasei Tovim',
            description: 'We value community service, acts of lovingkindness, humanitarian efforts, and unwavering support for Jewish people in need.',
        },
    ],
} as const;
