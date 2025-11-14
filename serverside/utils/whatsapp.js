/**
 * WhatsApp Order Notification Utility
 * Production-Ready (No console logs)
 */

const axios = require("axios");
require("dotenv").config();

// Environment variables
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ADMIN_PHONE = process.env.ADMIN_PHONE;

/**
 * Sends WhatsApp Order Notification to Admin
 *
 * @param {String|Number} orderId - Order ID
 * @param {String} name - Customer Name
 * @param {Number|String} totalAmount - Order Total
 */
const sendOrderNotification = async (orderId, name, totalAmount) => {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !ADMIN_PHONE) return;
  if (!orderId || !name || !totalAmount) return;

  const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  try {
    await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: ADMIN_PHONE,
        type: "template",
        template: {
          name: "desoft",
          language: { code: "en" },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "text",
                  text: String(orderId),
                },
              ],
            },
            {
              type: "body",
              parameters: [
                { type: "text", text: String(orderId) },
                { type: "text", text: name },
                { type: "text", text: `${totalAmount}` },
              ],
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Silent success (no console logs)
    return { success: true };

  } catch (error) {
    console.log(error)
    // ✅ Robust error return for logging layer
    return {
      success: false,
      error: error.response?.data || error.message || error,
    };
  }
};

module.exports = sendOrderNotification;
