## How the forecast works

The core of the app is a **cohort-component model**: the national and provincial populations broken out into 36 cells — eighteen 5-year age groups by sex — and advanced in five-year steps from the 2021 base year to 2071. At the start of each five-year increment:

1. In each province, population counts by sex and age cohort are aged by five years.
2. Counts of net internal (interprovincial) migrants by province, sex, and age cohort are added.
3. Age- and sex-specific fertility and mortality rates are applied to produce the population increment from the Canadian-born population.
4. Age- and sex-specific net international migration counts are added to the previous period's foreign-born population, and fertility and mortality rates are applied to calculate each province's increment due to international immigration.
5. Summing steps 3 and 4 gives the total population by sex and age cohort in each province.
6. Separately, for the % foreign-born indicator, net international migration is added to the previous period's foreign-born stock and mortality (but not fertility) is applied — children born in Canada to immigrant parents are not themselves foreign born.

The **current trends** scenario holds your selected reference period's age-specific fertility and mortality rates constant, admits immigrants at a fixed policy-target rate of 0.945% of the national population per year with the reference period's age, sex, and settlement profile, and keeps interprovincial flows proportional to each origin's population. Your scenario starts from exactly these settings, so the two lines coincide until you move something.
