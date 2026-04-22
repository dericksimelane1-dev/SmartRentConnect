const pool = require('../configs/db'); // adjust if your db file name differs

// Tenant submits verification documents
const submitTenantVerification = async (req, res) => {
  try {
    const tenantId = req.user.user_id; // from auth middleware

    const idDocumentUrl = req.files?.id_document?.[0]?.path;
    const proofOfIncomeUrl = req.files?.proof_of_income?.[0]?.path;

    if (!idDocumentUrl || !proofOfIncomeUrl) {
      return res.status(400).json({ message: 'All documents are required' });
    }

    const query = `
      INSERT INTO tenant_verification (
        tenant_id,
        id_document_url,
        proof_of_income_url,
        background_check,
        status,
        updated_at
      )
      VALUES ($1, $2, $3, false, 'pending', NOW())
      ON CONFLICT (tenant_id)
      DO UPDATE SET
        id_document_url = EXCLUDED.id_document_url,
        proof_of_income_url = EXCLUDED.proof_of_income_url,
        status = 'pending',
        updated_at = NOW();
    `;

    await pool.query(query, [
      tenantId,
      idDocumentUrl,
      proofOfIncomeUrl
    ]);

    
    // ✅ IMPORTANT: RETURN JSON ONLY (NO REDIRECTS)
    return res.status(200).json({
      message: 'Verification documents submitted successfully'
    });

  } catch (error) {
    console.error('Tenant verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitTenantVerification
};