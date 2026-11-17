export const LOR_TEMPLATE_CONFIG = {
  3: {
    id: "3",
    label: "3 Interns",
    file: "3-intern.pdf",
    internCount: 3,

    registerPages: [
      {
        pageIndex: 2,
        firstIntern: 0,
        count: 3,
      },
    ],

    declarationPageIndex: 3,

    rows: [
      {
        nameY: 292.8,
        domainY: 327.8,
        idY: 357.0,
        emailY: 327.8,
      },
      {
        nameY: 393.7,
        domainY: 428.8,
        idY: 458.1,
        emailY: 428.8,
      },
      {
        nameY: 494.8,
        domainY: 529.8,
        idY: 559.1,
        emailY: 529.8,
      },
    ],
  },

  6: {
    id: "6",
    label: "6 Interns",
    file: "6-intern.pdf",
    internCount: 6,

    registerPages: [
      {
        pageIndex: 2,
        firstIntern: 0,
        count: 6,
      },
    ],

    declarationPageIndex: 3,

    rows: [
      {
        nameY: 210.7,
        domainY: 245.6,
        idY: 274.9,
        emailY: 245.6,
      },
      {
        nameY: 304.2,
        domainY: 339.2,
        idY: 368.4,
        emailY: 339.2,
      },
      {
        nameY: 397.7,
        domainY: 432.7,
        idY: 461.9,
        emailY: 432.7,
      },
      {
        nameY: 491.2,
        domainY: 526.2,
        idY: 555.5,
        emailY: 526.2,
      },
      {
        nameY: 587.7,
        domainY: 622.7,
        idY: 652.0,
        emailY: 622.7,
      },
      {
        nameY: 681.1,
        domainY: 716.2,
        idY: 745.5,
        emailY: 716.2,
      },
    ],
  },

  8: {
    id: "8",
    label: "8 Interns",
    file: "8-intern.pdf",
    internCount: 8,

    registerPages: [
      {
        pageIndex: 2,
        firstIntern: 0,
        count: 5,
      },
      {
        pageIndex: 3,
        firstIntern: 5,
        count: 3,
      },
    ],

    declarationPageIndex: 4,

    rows: [
      {
        nameY: 265.5,
        domainY: 300.5,
        idY: 329.8,
        emailY: 300.5,
      },
      {
        nameY: 366.5,
        domainY: 401.5,
        idY: 430.8,
        emailY: 401.5,
      },
      {
        nameY: 467.5,
        domainY: 502.6,
        idY: 531.9,
        emailY: 502.6,
      },
      {
        nameY: 568.6,
        domainY: 603.5,
        idY: 632.8,
        emailY: 603.5,
      },
      {
        nameY: 669.5,
        domainY: 704.6,
        idY: 733.9,
        emailY: 704.6,
      },
      {
        nameY: 76.9,
        domainY: 111.9,
        idY: 141.2,
        emailY: 111.9,
      },
      {
        nameY: 177.9,
        domainY: 213.0,
        idY: 242.3,
        emailY: 213.0,
      },
      {
        nameY: 279.0,
        domainY: 314.0,
        idY: 343.2,
        emailY: 314.0,
      },
    ],
  },
};

export function getLORTemplateConfig(id) {
  return LOR_TEMPLATE_CONFIG[String(id)];
}
