const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    sender_name: { type: String, required: true },
    sender_email: { type: String, required: true },
    sender_phone: { type: String, required: true },
    message_content: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
