import Joi from "joi";

export const userRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name must not exceed 255 characters",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
  }),
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

export const sellerRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least 6 characters",
  }),
  shop_name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Shop name is required",
    "string.min": "Shop name must be at least 2 characters",
  }),
});

export const sellerLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

export const productSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    "string.empty": "Product name is required",
    "string.min": "Product name must be at least 2 characters",
  }),
  description: Joi.string().max(2000).optional(),
  price: Joi.number().positive().required().messages({
    "number.positive": "Price must be a positive number",
    "any.required": "Price is required",
  }),
  stock: Joi.number().integer().min(0).required().messages({
    "number.base": "Stock must be a number",
    "number.min": "Stock cannot be negative",
    "any.required": "Stock is required",
  }),
});

export const cartItemSchema = Joi.object({
  product_id: Joi.string().guid({ version: "uuidv4" }).required().messages({
    "string.empty": "Product ID is required",
    "string.guid": "Invalid product ID format",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),
});

export const updateCartItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).required().messages({
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),
});

export const orderSchema = Joi.object({
  coupon_code: Joi.string().optional(),
  wallet_points_used: Joi.number().integer().min(0).optional(),
});

export const paymentStatusSchema = Joi.object({
  order_id: Joi.string().guid({ version: "uuidv4" }).required(),
  status: Joi.string().valid("success", "failed").required(),
});

export const validateRequest = (schema: any) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));
      return res.status(400).json({ success: false, errors: messages });
    }

    req.validatedData = value;
    next();
  };
};
