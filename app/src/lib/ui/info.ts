// Content for the ⓘ popovers: plain-language explanation plus data source.

export interface InfoEntry {
	h: string;
	b: string[];
	s?: string;
}

export const INFO: Record<string, InfoEntry> = {
	presets: {
		h: 'Quick scenarios',
		b: [
			'One-tap starting points. Each sets all four assumptions at once; you can then fine-tune any slider.',
			'“Century Initiative” mirrors the advocacy proposal to reach 100 million Canadians by 2100 through higher immigration.'
		]
	},
	fert: {
		h: 'Fertility',
		b: [
			'Scales age-specific fertility rates up or down. 100% = the rates observed in your chosen reference period. Canada’s 2021 total fertility rate was about 1.4 children per woman — well below the replacement level of 2.1.'
		],
		s: 'StatCan Table 13-10-0418, crude birth rate and fertility rates by province.'
	},
	mort: {
		h: 'Mortality',
		b: [
			'Scales age-specific death rates for ages 55 and over, where most deaths occur. Below 100% means people live longer (e.g. medical advances); above 100% means shorter lives.'
		],
		s: 'StatCan Life Tables 2015–2017 (84-537-X).'
	},
	immig: {
		h: 'Immigration',
		b: [
			'Annual immigration as a share of the resident population. The 2021 policy level was about 0.95% (≈ 405,000 admissions). The federal 2024 plan lowered targets to about 1%; the Century Initiative advocates ~1.25%.'
		],
		s: 'StatCan Table 17-10-0014, international migration by age and sex; IRCC Immigration Levels Plans.'
	},
	ipmig: {
		h: 'Internal migration',
		b: [
			'Where Canadians move between provinces. “Current trends” replays the flows observed in the reference period; “Urban agglomeration” concentrates movers in Toronto, Montréal and Vancouver; “Resource boom” redirects them to Alberta and Saskatchewan.'
		],
		s: 'StatCan Tables 17-10-0015 and 17-10-0022, interprovincial migration by age, sex, origin and destination.'
	},
	refper: {
		h: 'Reference period',
		b: [
			'The historical window the model’s baseline rates are drawn from — fertility, mortality, immigration profile and interprovincial flows. 2016–21 includes the pandemic years; comparing periods shows how sensitive a 50-year projection is to its starting era.'
		]
	},
	item: {
		h: 'Indicators',
		b: [
			'Beyond raw population: the dependency ratio tracks how many children and seniors each 100 working-age people support; the Commons-seat indicators show how demographic change translates into political representation.'
		]
	},
	series: {
		h: 'Reading this chart',
		b: [
			'The dashed grey line is actual history. Blue continues current trends unchanged; orange applies your assumptions. Click anywhere on the chart to set the target year.'
		]
	},
	pyramid: {
		h: 'Population pyramid',
		b: [
			'Each bar is a five-year age group, men left and women right. Outlined bars show 2021; orange bars show your scenario in the target year. An aging population shows a bulge moving upward; sustained immigration widens the 20–44 bars.'
		]
	},
	map: {
		h: 'Map modes',
		b: [
			'Absolute value shows each province’s level in sequential blues (darker = higher). The two comparison modes use a diverging scale: blue = above, red = below, grey = no change.'
		]
	},
	seatrules: {
		h: 'How seats are allocated',
		b: [
			'Every ten years, each province’s population is divided by the electoral quotient (121,891 after the 2021 census) and rounded up. Two floors then apply: the senatorial clause (no fewer MPs than senators) and the grandfather clause (no fewer than in the previous Parliament, as amended in 2022). A final ratchet tops up provinces that fall newly below their population share.',
			'Because seats can only go up, slow-growing provinces keep their count while fast-growing ones gain — the House grows.'
		],
		s: 'Constitution Act, 1867, ss. 51–52; Preserving Provincial Representation Act, 2022.'
	},
	dep: {
		h: 'Dependency ratio',
		b: [
			'Children and youth (0–19) plus seniors (65+) per 100 people of working age (20–64). Higher values mean fewer workers supporting more dependants — the key fiscal-pressure indicator of an aging society.'
		]
	},
	fb: {
		h: 'Foreign-born share',
		b: [
			'Share of residents born outside Canada. It was 23% in 2021 — the highest in the G7. Immigration raises it; births in Canada to immigrant parents dilute it (their children are Canadian-born).'
		],
		s: '2016 Census, population by immigrant status, province, age and sex.'
	},
	'kpi-pop': {
		h: 'Population',
		b: [
			'Total population of the selected geography in the target year under your scenario, with growth relative to the 2021 census base.'
		]
	}
};
