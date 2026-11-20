const createRow = (top) => ({
  name: {
    x: 120.6,
    top,
    width: 120,
    height: 17,
    fontSize: 8.5,
  },
  internId: {
    x: 244.4,
    top,
    width: 110,
    height: 17,
    fontSize: 8.5,
  },
  domain: {
    x: 358.3,
    top,
    width: 122,
    height: 17,
    fontSize: 8.5,
  },
});

export const STIPEND_TEMPLATE_CONFIG = {
  2: {
    fileName: "Stipend-list-F2.pdf",
    internCount: 2,

    pages: {
      page1: {
        index: 0,
        fields: {
          batchName: {
            x: 57.2,
            top: 282.7,
            width: 153,
            height: 17,
            fontSize: 9,
          },
          releaseDate: {
            x: 226.7,
            top: 282.7,
            width: 150,
            height: 17,
            fontSize: 9,
          },
        },
      },

      page2: {
        index: 1,
        rows: [createRow(345.0), createRow(388.4)],
        fields: {
          batchName: {
            x: 311.4,
            top: 553.5,
            width: 180,
            height: 17,
            fontSize: 9,
          },
          releaseDate: {
            x: 311.4,
            top: 637.9,
            width: 180,
            height: 17,
            fontSize: 9,
          },
        },
      },

      page3: {
        index: 2,
        fields: {
          batchName: {
            x: 57.2,
            top: 195.8,
            width: 153,
            height: 17,
            fontSize: 9,
          },
          releaseDate: {
            x: 241.6,
            top: 195.8,
            width: 150,
            height: 17,
            fontSize: 9,
          },
        },
      },

      page4: {
        index: 3,
        fields: {
          batchName: {
            x: 257.5,
            top: 144.8,
            width: 165,
            height: 17,
            fontSize: 9,
          },
        },
      },
    },
  },

  3: {
    fileName: "Stipend-list-F3.pdf",
    internCount: 3,

    pages: {
      page1: {
        index: 0,
        fields: {
          batchName: {
            x: 57.2,
            top: 282.7,
            width: 153,
            height: 17,
            fontSize: 9,
          },
          releaseDate: {
            x: 226.7,
            top: 282.7,
            width: 150,
            height: 17,
            fontSize: 9,
          },
        },
      },

      page2: {
        index: 1,
        rows: [createRow(345.0), createRow(388.4), createRow(434.6)],
        fields: {
          batchName: {
            x: 311.4,
            top: 598.5,
            width: 180,
            height: 17,
            fontSize: 9,
          },
          releaseDate: {
            x: 311.4,
            top: 682.8,
            width: 180,
            height: 17,
            fontSize: 9,
          },
        },
      },

      page3: {
        index: 2,
        fields: {
          batchName: {
            x: 57.2,
            top: 195.8,
            width: 153,
            height: 17,
            fontSize: 9,
          },
          releaseDate: {
            x: 241.6,
            top: 195.8,
            width: 150,
            height: 17,
            fontSize: 9,
          },
        },
      },

      page4: {
        index: 3,
        fields: {
          batchName: {
            x: 257.5,
            top: 145,
            width: 165,
            height: 17,
            fontSize: 9,
          },
        },
      },
    },
  },
};

export function getStipendTemplateConfig(templateId) {
  const config = STIPEND_TEMPLATE_CONFIG[Number(templateId)];

  if (!config) {
    throw new Error("Invalid stipend template selected.");
  }

  return config;
}
