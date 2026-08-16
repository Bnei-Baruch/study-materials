export interface LineupOption {
  name: string
  link: string
}

// Snapshot import from the weekly schedule spreadsheet.
export const LINEUP_OPTIONS: LineupOption[] = [
  // Morning
  { name: 'בוקר א', link: 'https://docs.google.com/document/d/1e8TYHCjPtRyFXwSQE3iJhNbfDQmj-ZYsbV_JLDF4dV4/edit?tab=t.0' },
  { name: 'בוקר ב', link: 'https://docs.google.com/document/d/1tOAf-84e-d3tGbguXF4v2c6kdNnYga44UFXWCgbzhU0/edit?tab=t.0' },
  { name: 'בוקר ג', link: 'https://docs.google.com/document/d/1UbpzYcLylnoIBnULYwNeZpvzdPbaQ82DJTpk0hhI5Wo/edit?tab=t.0' },
  { name: 'בוקר ד', link: 'https://docs.google.com/document/d/1sOCsdUQ6YvoQDV1-yfdPhqqReQTSZEirZXLwf1kY8-M/edit?usp=drivesdk' },
  { name: 'בוקר ה', link: 'https://docs.google.com/document/d/1kfODAzIzvUzlLXl7t5WQDqhY4taaE1V0UBFaIRSO1oA/edit?tab=t.0' },
  { name: 'בוקר ו', link: 'https://docs.google.com/document/d/1dGUFqkTC1xv-XTn1tgOFyjaLmb4fH_fjEaGYmjHU95k/edit?tab=t.0' },

  // Afternoon
  { name: 'צהריים א', link: 'https://docs.google.com/document/d/1c799SWmzbs5fMHDP4qHTWAYIWht2Roiqzt5B6oIuBfw/edit?tab=t.0' },
  { name: 'צהריים ב', link: 'https://docs.google.com/document/d/1ErwjpljcUqsdRXRt18G_Te9-BsCoOyP0xYqrOqE_N04/edit?tab=t.0' },
  { name: 'צהריים ג', link: 'https://docs.google.com/document/d/1rGAjkwLXTVFtT6vMm7eDYkx6WeU_18bIS91GD5fah0Q/edit?tab=t.0' },
  { name: 'צהריים ד', link: 'https://docs.google.com/document/d/1menUnmQIdvkAvxEYK4o81xtQaDRxFYzVFrxRLvtqK2M/edit?usp=drivesdk' },
  { name: 'צהריים ה', link: 'https://docs.google.com/document/d/1uZBn498cwi4OKDx6tyno6fHyd9T1r26DsFq1UtejvDk/edit?tab=t.0' },
  { name: 'צהריים ו', link: 'https://docs.google.com/document/d/1IEogtOD7j8VkqwS0mQyI2NyB-KWzBI11ue4GmlI7-rk/edit?tab=t.0' },
  { name: 'צהריים ש', link: 'https://docs.google.com/document/d/13UBuXScJK_3N1ZdF5U1EYJqpMfjF3UjwiXvnLo-XNrk/edit?tab=t.0' },

  // Evening / Saturday
  { name: 'לומדים מהמקורות - ראשון ערב', link: 'https://docs.google.com/document/d/1WeU3z6Fq591EZYb4mdEps0Xwz_fTgS6RZlnQ-6zlSSc/edit?tab=t.0' },
  { name: 'קהילת הלומדים - שני ערב', link: 'https://docs.google.com/document/d/11_Nd219yljBX3PsNqxHk8J08cj2UlN-NDznIea7pEv0/edit?usp=drivesdk' },
  { name: 'אביהו ומושי - שלישי ערב', link: 'https://docs.google.com/document/d/16xqg_rU5yE9bxM_UlJWkH3T9A6KTj1tMJhHKeehv114/edit?tab=t.0' },
  { name: 'גלעד ואורן - רביעי ערב', link: 'https://docs.google.com/document/d/1GOBZcAJjSiJPCUtCrb-uTItWZcvkP_pzVyHFTHoRNo4/edit?tab=t.0' },
  { name: 'יום שבת בוקר - הנהלה', link: 'https://docs.google.com/document/d/1QtTvd25yaqmW_eMUP0OauuDbgFES2tgaWGXuNVRD86g/edit?usp=drivesdk' },
]
