import nodemailer from "nodemailer";
import { ENV } from "../config/env.js";

// Create transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Generate order confirmation email HTML
export function generateOrderEmailHTML(order, user) {
  const itemsHTML = order.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e0e0e0;">
        <div style="display: flex; align-items: center;">
          <img src="${item.images}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
          <div>
            <h4 style="margin: 0; color: #2c3e50;">${item.name}</h4>
            <p style="margin: 5px 0; color: #7f8c8d;">Quantity: ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #e0e0e0; text-align: right; font-weight: 600; color: #2c3e50;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `,
    )
    .join("");

  const discount = order.discount || 0;
  const subtotal = order.totalPrice + discount;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - Nexent</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Thank You!</h1>
                  <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Your order has been confirmed</p>
                </td>
              </tr>

              <!-- Order Details -->
              <tr>
                <td style="padding: 30px;">
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                    <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px;">Order Details</h2>
                    <p style="margin: 5px 0; color: #555;"><strong>Order ID:</strong> ${order._id}</p>
                    <p style="margin: 5px 0; color: #555;"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                    <p style="margin: 5px 0; color: #555;"><strong>Status:</strong> <span style="color: #27ae60; font-weight: 600;">${order.status.toUpperCase()}</span></p>
                    ${order.coinsEarned ? `<p style="margin: 5px 0; color: #555;"><strong>Coins Earned:</strong> <span style="color: #f39c12; font-weight: 600;">🪙 ${order.coinsEarned} coins</span></p>` : ""}
                  </div>

                  <!-- Shipping Address -->
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Shipping Address</h3>
                    <p style="margin: 5px 0; color: #555;">${order.shippingAddress.fullName}</p>
                    <p style="margin: 5px 0; color: #555;">${order.shippingAddress.streetAddress}</p>
                    <p style="margin: 5px 0; color: #555;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                    <p style="margin: 5px 0; color: #555;">📞 ${order.shippingAddress.phoneNumber}</p>
                  </div>

                  <!-- Order Items -->
                  <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Order Items</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; margin-bottom: 25px;">
                    ${itemsHTML}
                  </table>

                  <!-- Order Summary -->
                  <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">Order Summary</h3>
                    <table width="100%" cellpadding="5" cellspacing="0">
                      <tr>
                        <td style="color: #555; padding: 8px 0;">Subtotal:</td>
                        <td style="text-align: right; color: #555; padding: 8px 0;">$${subtotal.toFixed(2)}</td>
                      </tr>
                      ${
                        discount > 0
                          ? `
                      <tr>
                        <td style="color: #27ae60; padding: 8px 0;">Discount:</td>
                        <td style="text-align: right; color: #27ae60; padding: 8px 0;">-$${discount.toFixed(2)}</td>
                      </tr>
                      `
                          : ""
                      }
                      <tr style="border-top: 2px solid #ddd;">
                        <td style="color: #2c3e50; font-weight: 700; font-size: 18px; padding: 15px 0 0 0;">Total:</td>
                        <td style="text-align: right; color: #667eea; font-weight: 700; font-size: 20px; padding: 15px 0 0 0;">$${order.totalPrice.toFixed(2)}</td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #2c3e50; padding: 30px; text-align: center;">
                  <p style="color: #ecf0f1; margin: 0 0 10px 0; font-size: 14px;">Thank you for shopping with Nexent!</p>
                  <p style="color: #95a5a6; margin: 0; font-size: 12px;">This is an automated email. Please do not reply.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(order, userEmail, userName) {
  try {
    const mailOptions = {
      from: `"Nexent Store" <${ENV.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order Confirmation - Order #${order._id}`,
      html: generateOrderEmailHTML(order, { email: userEmail, name: userName }),
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

// Generate invoice email HTML (styled like the app)
export function generateInvoiceEmailHTML(order, user) {
  const orderId = order._id.toString();
  const itemsHTML = order.orderItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #2a2a2a;">
        <div style="display: flex; align-items: center;">
          <img src="${item.images}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
          <div>
            <h4 style="margin: 0; color: #ffffff;">${item.name}</h4>
            <p style="margin: 5px 0; color: #999;">Qty: ${item.quantity} × $${item.price.toFixed(2)}</p>
          </div>
        </div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #2a2a2a; text-align: right; font-weight: 600; color: #1DB954;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `,
    )
    .join("");

  const discount = order.discount || 0;
  const subtotal = order.totalPrice + discount;
  const invoiceDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice - Nexent</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #121212;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #121212; padding: 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: #121212; margin: 0; font-size: 32px; font-weight: 700;">INVOICE</h1>
                  <p style="color: #121212; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Team Nexent</p>
                </td>
              </tr>

              <!-- Invoice Info -->
              <tr>
                <td style="padding: 30px;">
                  <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 10px;">
                          <p style="margin: 0; color: #999; font-size: 13px;">Invoice Number</p>
                          <p style="margin: 5px 0 0 0; color: #1DB954; font-size: 16px; font-weight: 600;">INV-${orderId.slice(-8).toUpperCase()}</p>
                        </td>
                        <td style="padding-bottom: 10px; text-align: right;">
                          <p style="margin: 0; color: #999; font-size: 13px;">Date</p>
                          <p style="margin: 5px 0 0 0; color: #fff; font-size: 14px;">${invoiceDate}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 10px;">
                          <p style="margin: 0; color: #999; font-size: 13px;">Order ID</p>
                          <p style="margin: 5px 0 0 0; color: #fff; font-size: 14px;">${orderId}</p>
                        </td>
                        <td style="padding-top: 10px; text-align: right;">
                          <p style="margin: 0; color: #999; font-size: 13px;">Status</p>
                          <p style="margin: 5px 0 0 0; color: #1DB954; font-size: 14px; font-weight: 600;">${order.status.toUpperCase()}</p>
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Customer Info -->
                  <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                    <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 18px;">Bill To</h3>
                    <p style="margin: 5px 0; color: #fff; font-weight: 600;">${user.name}</p>
                    <p style="margin: 5px 0; color: #999;">${user.email}</p>
                    <p style="margin: 5px 0; color: #999;">${order.shippingAddress.streetAddress}</p>
                    <p style="margin: 5px 0; color: #999;">${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}</p>
                    <p style="margin: 5px 0; color: #999;">📞 ${order.shippingAddress.phoneNumber}</p>
                  </div>

                  <!-- Order Items -->}
                  <h3 style="color: #fff; margin: 0 0 15px 0; font-size: 18px;">Items</h3>
                  <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #2a2a2a; border-radius: 8px; overflow: hidden; margin-bottom: 25px;">
                    ${itemsHTML}
                  </table>

                  <!-- Summary -->
                  <div style="background-color: #2a2a2a; padding: 20px; border-radius: 8px;">
                    <table width="100%" cellpadding="5" cellspacing="0">
                      <tr>
                        <td style="color: #999; padding: 8px 0;">Subtotal:</td>
                        <td style="text-align: right; color: #fff; padding: 8px 0;">$${subtotal.toFixed(2)}</td>
                      </tr>
                      ${
                        discount > 0
                          ? `
                      <tr>
                        <td style="color: #1DB954; padding: 8px 0;">Discount:</td>
                        <td style="text-align: right; color: #1DB954; padding: 8px 0;">-$${discount.toFixed(2)}</td>
                      </tr>
                      `
                          : ""
                      }
                      ${
                        order.coinsEarned
                          ? `
                      <tr>
                        <td style="color: #ffd700; padding: 8px 0;">Coins Earned:</td>
                        <td style="text-align: right; color: #ffd700; padding: 8px 0;">🪙 ${order.coinsEarned}</td>
                      </tr>
                      `
                          : ""
                      }
                      <tr style="border-top: 2px solid #1DB954;">
                        <td style="color: #fff; font-weight: 700; font-size: 18px; padding: 15px 0 0 0;">Total:</td>
                        <td style="text-align: right; color: #1DB954; font-weight: 700; font-size: 20px; padding: 15px 0 0 0;">$${order.totalPrice.toFixed(2)}</td>
                      </tr>
                    </table>
                  </div>

                  <!-- Thank you message -->
                  <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #2a2a2a; border-radius: 8px;">
                    <p style="color: #1DB954; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">Thank you for your purchase!</p>
                    <p style="color: #999; margin: 0; font-size: 14px;">We appreciate your business and hope you enjoy your products.</p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #0a0a0a; padding: 30px; text-align: center;">
                  <p style="color: #1DB954; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Team Nexent</p>
                  <p style="color: #666; margin: 0; font-size: 12px;">This is an automated invoice. Please keep this for your records.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Send invoice email after review
export async function sendOrderInvoiceEmail(order, userEmail, userName) {
  try {
    const orderId = order._id.toString();
    const mailOptions = {
      from: `"Team Nexent" <${ENV.EMAIL_USER}>`,
      to: userEmail,
      subject: `Invoice - Order #${orderId.slice(-8).toUpperCase()}`,
      html: generateInvoiceEmailHTML(order, {
        email: userEmail,
        name: userName,
      }),
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return false;
  }
}
