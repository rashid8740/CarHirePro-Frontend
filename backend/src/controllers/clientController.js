import Client from '../models/Client.js';

// Add new client
export const addClient = async (req, res) => {
  try {
    const { fullName, idOrPassport, phone, address, licenseNumber, citizenship } = req.body;

    if (!fullName || !idOrPassport || !licenseNumber || !citizenship || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: fullName, idOrPassport, licenseNumber, citizenship, and phone are required'
      });
    }

    const existingClient = await Client.findOne({
      $or: [
        { idOrPassport: idOrPassport.toUpperCase() },
        { phone: phone.trim() },
        { licenseNumber: licenseNumber.toUpperCase() }
      ]
    });

    if (existingClient) {
      let message = 'Client already exists with ';
      if (existingClient.idOrPassport === idOrPassport.toUpperCase()) {
        message += 'this ID/Passport number';
      } else if (existingClient.phone === phone.trim()) {
        message += 'this phone number';
      } else if (existingClient.licenseNumber === licenseNumber.toUpperCase()) {
        message += 'this license number';
      }

      return res.status(400).json({ success: false, message });
    }

    const client = await Client.create({
      fullName: fullName.trim(),
      idOrPassport: idOrPassport.toUpperCase(),
      phone: phone.trim(),
      address: address ? address.trim() : undefined,
      licenseNumber: licenseNumber.toUpperCase(),
      citizenship: citizenship.trim()
    });

    return res.status(201).json({
      success: true,
      message: 'Client added successfully',
      data: client
    });

  } catch (error) {
    console.error('Error adding client:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add client. Please try again.'
    });
  }
};

// Fetch all clients
export const getAllClients = async (req, res) => {
  try {
    const clients = await Client.find({})
      .select('_id fullName idOrPassport phone address licenseNumber citizenship status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch clients. Please try again.'
    });
  }
};

// Get single client by ID
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id).lean();

    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: client
    });

  } catch (error) {
    console.error('Error fetching client:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch client. Please try again.'
    });
  }
};

// Update client
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, idOrPassport, phone, address, licenseNumber, citizenship } = req.body;

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }

    // Optional: Check if updated fields conflict with other clients
    if (idOrPassport && idOrPassport.toUpperCase() !== client.idOrPassport) {
      const existingId = await Client.findOne({ idOrPassport: idOrPassport.toUpperCase() });
      if (existingId) return res.status(400).json({ success: false, message: 'ID/Passport already exists' });
    }

    if (phone && phone !== client.phone) {
      const existingPhone = await Client.findOne({ phone: phone.trim() });
      if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already exists' });
    }

    if (licenseNumber && licenseNumber.toUpperCase() !== client.licenseNumber) {
      const existingLicense = await Client.findOne({ licenseNumber: licenseNumber.toUpperCase() });
      if (existingLicense) return res.status(400).json({ success: false, message: 'License number already exists' });
    }

    client.fullName = fullName ?? client.fullName;
    client.idOrPassport = idOrPassport ? idOrPassport.toUpperCase() : client.idOrPassport;
    client.phone = phone ?? client.phone;
    client.address = address ?? client.address;
    client.licenseNumber = licenseNumber ? licenseNumber.toUpperCase() : client.licenseNumber;
    client.citizenship = citizenship ?? client.citizenship;

    await client.save();

    return res.status(200).json({
      success: true,
      message: 'Client updated successfully',
      data: client
    });

  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({ success: false, message: 'Failed to update client. Please try again.' });
  }
};

// DELETE a client
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedClient = await Client.findByIdAndDelete(id);
    if (!deletedClient) {
      return res.status(404).json({ success: false, message: 'Client not found' });
    }
    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete client', error: error.message });
  }
};

// Update client status
export const updateClientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be either ACTIVE or SUSPENDED'
      });
    }

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Update status
    client.status = status;
    await client.save();

    return res.status(200).json({
      success: true,
      message: `Client status updated to ${status} successfully`,
      data: client
    });

  } catch (error) {
    console.error('Error updating client status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update client status. Please try again.'
    });
  }
};

// Get clients by status
export const getClientsByStatus = async (req, res) => {
  try {
    const { status } = req.query;

    // Validate status parameter
    if (status && !['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status filter. Use ACTIVE or SUSPENDED'
      });
    }

    const filter = status ? { status } : {};
    
    const clients = await Client.find(filter)
      .select('_id fullName idOrPassport phone address licenseNumber citizenship status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: clients.length,
      data: clients
    });

  } catch (error) {
    console.error('Error fetching clients by status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch clients. Please try again.'
    });
  }
};
