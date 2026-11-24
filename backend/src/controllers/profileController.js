import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../config/Supabase.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first."
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      profile: data
    });

  } catch (error) {
    console.error("GET PROFILE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load profile."
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first."
      });
    }

    const fullName =
      req.body.full_name || req.body.fullName;

    const phone = req.body.phone;

    if (
      typeof fullName !== "string" ||
      !fullName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Full name is required."
      });
    }

    if (phone != null && typeof phone !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number."
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data,
      profile: data
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile."
    });
  }
};


export const updateAddress = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first."
      });
    }

    const {
      address,
      city,
      province
    } = req.body;

    const postalCode =
      req.body.postal_code || req.body.postalCode;

    const fields = [
      address,
      city,
      province,
      postalCode
    ];

    if (
      fields.some(
        value =>
          typeof value !== "string" ||
          !value.trim()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please complete your delivery address."
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        postal_code: postalCode.trim(),
        updated_at: new Date().toISOString()
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Delivery address updated successfully.",
      data,
      profile: data
    });

  } catch (error) {
    console.error("UPDATE ADDRESS ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update delivery address."
    });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image."
      });
    }

    const allowedTypes = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp"
    };

    const extension =
      allowedTypes[req.file.mimetype];

    if (!extension) {
      return res.status(400).json({
        success: false,
        message: "Only JPG, PNG and WEBP images are allowed."
      });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "Image must not exceed 5MB."
      });
    }

    const fileName =
      `${userId}/${randomUUID()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("avatars")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const avatarUrl = urlData.publicUrl;

    const { data, error: updateError } =
      await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", userId)
        .select()
        .single();

    if (updateError) {
      await supabase.storage
        .from("avatars")
        .remove([fileName]);

      throw updateError;
    }

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully.",
      avatar_url: avatarUrl,
      data,
      profile: data
    });

  } catch (error) {
    console.error("UPLOAD AVATAR ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to upload profile picture."
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first."
      });
    }


    const currentPassword =
      req.body.currentPassword ||
      req.body.current_password;

    const newPassword =
      req.body.newPassword ||
      req.body.new_password;

    const confirmPassword =
      req.body.confirmPassword ||
      req.body.confirm_password;


    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string" ||
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required."
      });
    }


    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters."
      });
    }


    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match."
      });
    }


    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password."
      });
    }


    const {
      data: authData,
      error: authError
    } = await supabase.auth.admin.getUserById(
      userId
    );

    if (authError || !authData?.user?.email) {
      return res.status(404).json({
        success: false,
        message: "User account not found."
      });
    }

    const email = authData.user.email;


    const authClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    const {
      data: loginData,
      error: loginError
    } = await authClient.auth.signInWithPassword({
      email,
      password: currentPassword
    });

    if (
      loginError ||
      loginData?.user?.id !== userId
    ) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect."
      });
    }

    const { error: updateError } =
      await authClient.auth.updateUser({
        password: newPassword
      });

    if (updateError) {
      console.error(
        "PASSWORD UPDATE ERROR:",
        updateError.message
      );

      return res.status(400).json({
        success: false,
        message: "Unable to update password."
      });
    }

    const { error: signOutError } =
      await authClient.auth.signOut({
        scope: "global"
      });

    if (signOutError) {
      console.error(
        "SESSION REVOCATION ERROR:",
        signOutError.message
      );
    }

    console.log("PASSWORD UPDATED SUCCESSFULLY");

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
      requireLogin: true
    });

  } catch (error) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to change password."
    });
  }
};

export const updateDeliveryAddress = updateAddress;
export const uploadProfilePicture = uploadAvatar;
export const updatePassword = changePassword;