import { supabase } from "../config/Supabase.js";

export const getCustomers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, role")
      .eq("role", "customer")
      .order("full_name", { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      customers: data || []
    });
  } catch (error) {
    console.error("GET CUSTOMERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load customers."
    });
  }
};

export const createCustomer = async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body;

    if (!full_name?.trim() || !email?.trim() || !password) {
      return res.status(422).json({
        success: false,
        message: "Name, email and password are required."
      });
    }

    if (password.length < 8) {
      return res.status(422).json({
        success: false,
        message: "Password must contain at least 8 characters."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: full_name.trim()
        }
      });

    if (authError) throw authError;

    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        full_name: full_name.trim(),
        email: normalizedEmail,
        phone: phone || null,
        role: "customer"
      }, {
        onConflict: "id"
      })
      .select()
      .single();

    if (error) {
      const { error: cleanupError } =
        await supabase.auth.admin.deleteUser(authData.user.id);

      if (cleanupError) {
        console.error("CLEANUP ERROR:", cleanupError);
      }

      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Customer created successfully.",
      customer: data
    });
  } catch (error) {
    console.error("CREATE CUSTOMER ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create customer."
    });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone } = req.body;

    if (!full_name?.trim() || !email?.trim()) {
      return res.status(422).json({
        success: false,
        message: "Name and email are required."
      });
    }

    const { data: existing, error: lookupError } =
      await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("id", id)
        .maybeSingle();

    if (lookupError) throw lookupError;

    if (!existing || existing.role !== "customer") {
      return res.status(404).json({
        success: false,
        message: "Customer not found."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailChanged = normalizedEmail !== existing.email;

    if (emailChanged) {
      const { error: authError } =
        await supabase.auth.admin.updateUserById(id, {
          email: normalizedEmail,
          email_confirm: true
        });

      if (authError) throw authError;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: full_name.trim(),
        email: normalizedEmail,
        phone: phone || null
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (emailChanged) {
        const { error: rollbackError } =
          await supabase.auth.admin.updateUserById(id, {
            email: existing.email,
            email_confirm: true
          });

        if (rollbackError) {
          console.error("ROLLBACK ERROR:", rollbackError);
        }
      }

      throw error;
    }

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully.",
      customer: data
    });
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to update customer."
    });
  }
};


export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: lookupError } =
      await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", id)
        .maybeSingle();

    if (lookupError) throw lookupError;

    if (!existing || existing.role !== "customer") {
      return res.status(404).json({
        success: false,
        message: "Customer not found."
      });
    }

    const { error } =
      await supabase.auth.admin.deleteUser(id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully."
    });
  } catch (error) {
    console.error("DELETE CUSTOMER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to delete customer."
    });
  }
};
