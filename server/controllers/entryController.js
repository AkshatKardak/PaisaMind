const asyncHandler = require("express-async-handler");
const { parseEntry } = require("../services/pasteParserService");

/**
 * @desc Parse pasted transaction alert or SMS text
 * @route POST /api/entries/parse
 * @access Public / Authenticated
 */
const parseEntryController = asyncHandler(async (req, res) => {
  const { text, source = "manual" } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({
      success: false,
      message: "Text field is required and must be a string."
    });
  }

  const result = await parseEntry(text, source);
  return res.status(200).json(result);
});

module.exports = {
  parseEntryController
};
