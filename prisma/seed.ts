import { PrismaClient, Role, Currency, FileType, StatementStatus, TransactionType, TransactionCategory, MatchStatus, InvoiceType, InvoiceStatus, MatchType, RuleSource, ReportType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("FlowForge123!", 12);

  // ── Organization ─────────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { cuit: "30-71234567-9" },
    update: {},
    create: {
      name: "Distribuidora Norte SRL",
      cuit: "30-71234567-9",
      fiscalCategory: "Responsable Inscripto",
    },
  });
  console.log(`✅ Organization: ${org.name}`);

  // ── Users ─────────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "martin.rodriguez@distribuidoranorte.com.ar" },
    update: {},
    create: {
      email: "martin.rodriguez@distribuidoranorte.com.ar",
      name: "Martín Rodríguez",
      password: hashedPassword,
      role: Role.admin,
      orgId: org.id,
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: "carolina.gomez@distribuidoranorte.com.ar" },
    update: {},
    create: {
      email: "carolina.gomez@distribuidoranorte.com.ar",
      name: "Carolina Gómez",
      password: hashedPassword,
      role: Role.viewer,
      orgId: org.id,
    },
  });
  console.log(`✅ Users: ${adminUser.name}, ${viewerUser.name}`);

  // ── Bank Accounts ─────────────────────────────────────────────────────────────
  const ba1 = await prisma.bankAccount.upsert({
    where: { id: "ba-1" },
    update: {},
    create: {
      id: "ba-1",
      orgId: org.id,
      bankName: "Banco Galicia",
      accountNumber: "4019871/2 070-3",
      cbu: "0070670230000712345691",
      currency: Currency.ARS,
      createdBy: adminUser.id,
    },
  });

  const ba2 = await prisma.bankAccount.upsert({
    where: { id: "ba-2" },
    update: {},
    create: {
      id: "ba-2",
      orgId: org.id,
      bankName: "Banco BIND",
      accountNumber: "5002341/7 322-1",
      cbu: "3220001230000098765437",
      currency: Currency.ARS,
      createdBy: adminUser.id,
    },
  });
  console.log(`✅ Bank accounts: ${ba1.bankName}, ${ba2.bankName}`);

  // ── Bank Statements ───────────────────────────────────────────────────────────
  const stmt1 = await prisma.bankStatement.upsert({
    where: { id: "stmt-1" },
    update: {},
    create: {
      id: "stmt-1",
      bankAccountId: ba1.id,
      uploadedBy: adminUser.id,
      periodStart: new Date("2026-03-01"),
      periodEnd: new Date("2026-03-31"),
      filePath: "/uploads/galicia-mar-2026.pdf",
      fileType: FileType.pdf,
      status: StatementStatus.completed,
      closingBalance: 2_525_570.75,
      transactionCount: 47,
      matchedCount: 41,
    },
  });

  const stmt2 = await prisma.bankStatement.upsert({
    where: { id: "stmt-2" },
    update: {},
    create: {
      id: "stmt-2",
      bankAccountId: ba1.id,
      uploadedBy: adminUser.id,
      periodStart: new Date("2026-02-01"),
      periodEnd: new Date("2026-02-28"),
      filePath: "/uploads/galicia-feb-2026.pdf",
      fileType: FileType.pdf,
      status: StatementStatus.reconciled,
      closingBalance: 1_924_350.75,
      transactionCount: 52,
      matchedCount: 48,
    },
  });

  const stmt3 = await prisma.bankStatement.upsert({
    where: { id: "stmt-3" },
    update: {},
    create: {
      id: "stmt-3",
      bankAccountId: ba2.id,
      uploadedBy: adminUser.id,
      periodStart: new Date("2026-03-01"),
      periodEnd: new Date("2026-03-31"),
      filePath: "/uploads/bind-mar-2026.csv",
      fileType: FileType.csv,
      status: StatementStatus.reviewing,
      closingBalance: 892_300.5,
      transactionCount: 31,
      matchedCount: 18,
    },
  });
  console.log(`✅ Bank statements: 3 created`);

  // ── Invoices ──────────────────────────────────────────────────────────────────
  const invoices = [
    {
      id: "inv-1",
      invoiceNumber: "A 0003-00007821",
      type: InvoiceType.factura_a,
      counterpartyName: "Limpieza Total SA",
      counterpartyCuit: "30-65412387-5",
      netAmount: 318_099.17,
      ivaAmount: 66_800.83,
      totalAmount: 384_900.0,
      issueDate: new Date("2026-02-24"),
      dueDate: new Date("2026-03-26"),
      status: InvoiceStatus.matched,
    },
    {
      id: "inv-2",
      invoiceNumber: "A 0001-00003412",
      type: InvoiceType.factura_a,
      counterpartyName: "Químicos del Sur SRL",
      counterpartyCuit: "30-71098234-1",
      netAmount: 199_636.36,
      ivaAmount: 41_923.64,
      totalAmount: 241_560.0,
      issueDate: new Date("2026-02-26"),
      dueDate: new Date("2026-03-28"),
      status: InvoiceStatus.matched,
    },
    {
      id: "inv-3",
      invoiceNumber: "A 0002-00009823",
      type: InvoiceType.factura_a,
      counterpartyName: "Envases Plásticos Arg SA",
      counterpartyCuit: "30-60987654-3",
      netAmount: 129_818.18,
      ivaAmount: 27_261.82,
      totalAmount: 157_080.0,
      issueDate: new Date("2026-03-01"),
      dueDate: new Date("2026-03-31"),
      status: InvoiceStatus.matched,
    },
    {
      id: "inv-4",
      invoiceNumber: "B 0001-08200341",
      type: InvoiceType.factura_b,
      counterpartyName: "EDESUR SA",
      counterpartyCuit: "33-67815550-9",
      netAmount: 38_450.0,
      ivaAmount: 0,
      totalAmount: 38_450.0,
      issueDate: new Date("2026-03-08"),
      dueDate: new Date("2026-03-22"),
      status: InvoiceStatus.matched,
    },
    {
      id: "inv-5",
      invoiceNumber: "B 0012-00987234",
      type: InvoiceType.factura_b,
      counterpartyName: "Telecom Argentina SA",
      counterpartyCuit: "30-70847239-9",
      netAmount: 24_890.0,
      ivaAmount: 0,
      totalAmount: 24_890.0,
      issueDate: new Date("2026-03-10"),
      dueDate: new Date("2026-03-25"),
      status: InvoiceStatus.matched,
    },
    {
      id: "inv-6",
      invoiceNumber: "B 0001-00000412",
      type: InvoiceType.factura_b,
      counterpartyName: "Inmobiliaria Norte SRL",
      counterpartyCuit: "30-68234091-7",
      netAmount: 520_000.0,
      ivaAmount: 0,
      totalAmount: 520_000.0,
      issueDate: new Date("2026-02-28"),
      dueDate: new Date("2026-03-05"),
      status: InvoiceStatus.partially_matched,
    },
    {
      id: "inv-7",
      invoiceNumber: "A 0001-00000234",
      type: InvoiceType.factura_a,
      counterpartyName: "Supermercados Coto CICSA",
      counterpartyCuit: "30-50123456-9",
      netAmount: 696_280.99,
      ivaAmount: 146_219.01,
      totalAmount: 842_500.0,
      issueDate: new Date("2026-02-18"),
      dueDate: new Date("2026-03-04"),
      status: InvoiceStatus.matched,
    },
    {
      id: "inv-8",
      invoiceNumber: "A 0001-00000228",
      type: InvoiceType.factura_a,
      counterpartyName: "Jumbo Retail Argentina SA",
      counterpartyCuit: "30-70308853-5",
      netAmount: 563_099.17,
      ivaAmount: 118_250.83,
      totalAmount: 681_350.0,
      issueDate: new Date("2026-02-20"),
      dueDate: new Date("2026-03-07"),
      status: InvoiceStatus.partially_matched,
    },
    {
      id: "inv-9",
      invoiceNumber: "A 0001-00000241",
      type: InvoiceType.factura_a,
      counterpartyName: "Carrefour Argentina SA",
      counterpartyCuit: "30-68580547-3",
      netAmount: 423_834.71,
      ivaAmount: 89_005.29,
      totalAmount: 512_840.0,
      issueDate: new Date("2026-02-25"),
      dueDate: new Date("2026-03-11"),
      status: InvoiceStatus.matched,
    },
    {
      id: "inv-10",
      invoiceNumber: "A 0001-00000219",
      type: InvoiceType.factura_a,
      counterpartyName: "Walmart Argentina SRL",
      counterpartyCuit: "30-67799498-4",
      netAmount: 239_504.13,
      ivaAmount: 50_195.87,
      totalAmount: 289_700.0,
      issueDate: new Date("2026-03-05"),
      dueDate: new Date("2026-03-19"),
      status: InvoiceStatus.matched,
    },
    {
      id: "inv-11",
      invoiceNumber: "A 0001-00000243",
      type: InvoiceType.factura_a,
      counterpartyName: "Farmacity SA",
      counterpartyCuit: "30-69984221-3",
      netAmount: 164_090.91,
      ivaAmount: 34_359.09,
      totalAmount: 198_450.0,
      issueDate: new Date("2026-03-10"),
      dueDate: new Date("2026-03-24"),
      status: InvoiceStatus.matched,
    },
    {
      id: "inv-12",
      invoiceNumber: "A 0001-00000231",
      type: InvoiceType.factura_a,
      counterpartyName: "Disco Ahold Argentina SA",
      counterpartyCuit: "30-68763406-7",
      netAmount: 320_371.9,
      ivaAmount: 67_278.1,
      totalAmount: 387_650.0,
      issueDate: new Date("2026-02-22"),
      dueDate: new Date("2026-03-09"),
      status: InvoiceStatus.matched,
    },
    {
      id: "inv-13",
      invoiceNumber: "NC A 0003-00000089",
      type: InvoiceType.nota_credito,
      counterpartyName: "Limpieza Total SA",
      counterpartyCuit: "30-65412387-5",
      netAmount: -15_000.0,
      ivaAmount: -3_150.0,
      totalAmount: -18_150.0,
      issueDate: new Date("2026-03-14"),
      dueDate: new Date("2026-03-14"),
      status: InvoiceStatus.pending,
    },
    {
      id: "inv-14",
      invoiceNumber: "A 0001-00003187",
      type: InvoiceType.factura_a,
      counterpartyName: "Químicos del Sur SRL",
      counterpartyCuit: "30-71098234-1",
      netAmount: 154_090.91,
      ivaAmount: 32_359.09,
      totalAmount: 186_450.0,
      issueDate: new Date("2026-01-28"),
      dueDate: new Date("2026-02-28"),
      status: InvoiceStatus.overdue,
    },
    {
      id: "inv-15",
      invoiceNumber: "A 0001-00000247",
      type: InvoiceType.factura_a,
      counterpartyName: "Tiendas Metro SRL",
      counterpartyCuit: "30-70912345-6",
      netAmount: 129_173.55,
      ivaAmount: 27_126.45,
      totalAmount: 156_300.0,
      issueDate: new Date("2026-03-15"),
      dueDate: new Date("2026-03-26"),
      status: InvoiceStatus.matched,
    },
    {
      id: "inv-16",
      invoiceNumber: "A 0001-00000235",
      type: InvoiceType.factura_a,
      counterpartyName: "Makro Argentina SA",
      counterpartyCuit: "30-71234098-2",
      netAmount: 392_892.56,
      ivaAmount: 82_507.44,
      totalAmount: 475_400.0,
      issueDate: new Date("2026-02-28"),
      dueDate: new Date("2026-03-15"),
      status: InvoiceStatus.partially_matched,
    },
    {
      id: "inv-17",
      invoiceNumber: "B 0002-00456823",
      type: InvoiceType.factura_b,
      counterpartyName: "Seguros Arg SA",
      counterpartyCuit: "30-69812340-5",
      netAmount: 47_800.0,
      ivaAmount: 0,
      totalAmount: 47_800.0,
      issueDate: new Date("2026-03-01"),
      dueDate: new Date("2026-03-15"),
      status: InvoiceStatus.partially_matched,
    },
  ];

  for (const inv of invoices) {
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {},
      create: { ...inv, orgId: org.id },
    });
  }
  console.log(`✅ Invoices: ${invoices.length} created`);

  // ── Transactions ──────────────────────────────────────────────────────────────
  const transactions = [
    {
      id: "tx-1",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-03"),
      description: "TRF LIMPIEZA TOTAL SA - FC A 0003-00007821",
      amount: -384_900.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.pago_proveedor,
      aiConfidence: 0.97,
      matchStatus: MatchStatus.confirmed,
      matchedInvoiceId: "inv-1",
    },
    {
      id: "tx-2",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-04"),
      description: "TRF QUIMICOS DEL SUR SRL - FC A 0001-00003412",
      amount: -241_560.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.pago_proveedor,
      aiConfidence: 0.95,
      matchStatus: MatchStatus.confirmed,
      matchedInvoiceId: "inv-2",
    },
    {
      id: "tx-3",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-05"),
      description: "DEBITO ENVASES PLASTICOS ARG SA - OC 9823",
      amount: -157_080.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.pago_proveedor,
      aiConfidence: 0.93,
      matchStatus: MatchStatus.confirmed,
      matchedInvoiceId: "inv-3",
    },
    {
      id: "tx-4",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-10"),
      description: "SUELDO MARZO - LOPEZ J - CUIL 20-34512678-9",
      amount: -487_500.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.salario,
      aiConfidence: 0.98,
      matchStatus: MatchStatus.confirmed,
    },
    {
      id: "tx-5",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-10"),
      description: "SUELDO MARZO - GARCIA P - CUIL 27-29876541-3",
      amount: -394_200.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.salario,
      aiConfidence: 0.98,
      matchStatus: MatchStatus.confirmed,
    },
    {
      id: "tx-6",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-10"),
      description: "SUELDO MARZO - FERNANDEZ C - CUIL 20-30124567-8",
      amount: -312_800.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.salario,
      aiConfidence: 0.97,
      matchStatus: MatchStatus.confirmed,
    },
    {
      id: "tx-7",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-01"),
      description: "DEBITO INMOBILIARIA NORTE SRL - ALQ DEPOSITO AV ENTRE RIOS 1240",
      amount: -520_000.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.alquiler,
      aiConfidence: 0.91,
      matchStatus: MatchStatus.suggested,
      matchedInvoiceId: "inv-6",
    },
    {
      id: "tx-8",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-12"),
      description: "EDESUR SA - FACTURA 8200341290 - SUMINISTRO ELECTRICO",
      amount: -38_450.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.servicio,
      aiConfidence: 0.96,
      matchStatus: MatchStatus.confirmed,
      matchedInvoiceId: "inv-4",
    },
    {
      id: "tx-9",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-15"),
      description: "TELECOM ARGENTINA SA - FACTURA 0012-00987234",
      amount: -24_890.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.servicio,
      aiConfidence: 0.94,
      matchStatus: MatchStatus.confirmed,
      matchedInvoiceId: "inv-5",
    },
    {
      id: "tx-10",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-01"),
      description: "COMISION MANTENIMIENTO CTA CORRIENTE MAR/2026",
      amount: -3_250.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.comision_bancaria,
      aiConfidence: 0.99,
      matchStatus: MatchStatus.confirmed,
    },
    {
      id: "tx-11",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-31"),
      description: "IMP DEBITOS Y CRED BANCARIOS LEY 25413 - MAR/2026",
      amount: -28_760.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.comision_bancaria,
      aiConfidence: 0.96,
      matchStatus: MatchStatus.confirmed,
    },
    {
      id: "tx-12",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-07"),
      description: "AFIP - RET GANANCIAS 3RA CATEGORIA PER 02/2026",
      amount: -45_600.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.retencion,
      aiConfidence: 0.95,
      matchStatus: MatchStatus.suggested,
    },
    {
      id: "tx-13",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-07"),
      description: "ARBA - PERCEPCION IIBB PROVINCIA BA 2.5% PER 02/2026",
      amount: -18_750.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.percepcion,
      aiConfidence: 0.97,
      matchStatus: MatchStatus.confirmed,
    },
    {
      id: "tx-14",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-18"),
      description: "TRANSFERENCIA PROPIA - GALICIA ARS A CTA USD 0070670230000712345",
      amount: -200_000.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.transferencia_interna,
      aiConfidence: 0.88,
      matchStatus: MatchStatus.confirmed,
    },
    {
      id: "tx-15",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-20"),
      description: "AFIP VEP IVA MENSUAL PERIODO 02/2026 - F731",
      amount: -78_200.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.iva,
      aiConfidence: 0.94,
      matchStatus: MatchStatus.suggested,
    },
    {
      id: "tx-16",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-03"),
      description: "COBRO DEBIN - SUPERMERCADOS COTO CICSA CUIT 30-50123456-9",
      amount: 842_500.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.cobro_cliente,
      aiConfidence: 0.97,
      matchStatus: MatchStatus.confirmed,
      matchedInvoiceId: "inv-7",
    },
    {
      id: "tx-17",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-05"),
      description: "COBRO ECHEQ JUMBO RETAIL ARG SA - CHQ 0000043891",
      amount: 624_350.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.cobro_cliente,
      aiConfidence: 0.92,
      matchStatus: MatchStatus.suggested,
      matchedInvoiceId: "inv-8",
    },
    {
      id: "tx-18",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-08"),
      description: "ACRED TRANSFERENCIA - DISCO AHOLD ARGENTINA SA",
      amount: 387_650.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.cobro_cliente,
      aiConfidence: 0.91,
      matchStatus: MatchStatus.confirmed,
      matchedInvoiceId: "inv-12",
    },
    {
      id: "tx-19",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-10"),
      description: "COBRO DEBIN - CARREFOUR ARGENTINA SA CUIT 30-68580547-3",
      amount: 512_840.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.cobro_cliente,
      aiConfidence: 0.96,
      matchStatus: MatchStatus.confirmed,
      matchedInvoiceId: "inv-9",
    },
    {
      id: "tx-20",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-12"),
      description: "TRF RECIBIDA - RODRIGUEZ M CUIT 20-29871234-5",
      amount: 350_000.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.transferencia_interna,
      aiConfidence: 0.62,
      matchStatus: MatchStatus.suggested,
      matchedInvoiceId: "inv-16",
    },
    {
      id: "tx-21",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-14"),
      description: "COBRO ECHEQ - MAKRO ARG SA CHQ 0000098712",
      amount: 125_400.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.cobro_cliente,
      aiConfidence: 0.87,
      matchStatus: MatchStatus.suggested,
      matchedInvoiceId: "inv-16",
    },
    {
      id: "tx-22",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-17"),
      description: "ACRED TRF - WALMART ARGENTINA SRL",
      amount: 289_700.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.cobro_cliente,
      aiConfidence: 0.94,
      matchStatus: MatchStatus.confirmed,
      matchedInvoiceId: "inv-10",
    },
    {
      id: "tx-23",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-20"),
      description: "DEPOSITO EFECTIVO SUCURSAL 070 CAJA 3",
      amount: 80_000.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.otros,
      aiConfidence: 0.45,
      matchStatus: MatchStatus.unmatched,
    },
    {
      id: "tx-24",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-21"),
      description: "COBRO ECHEQ - FARMACITY SA CHQ 0000128340",
      amount: 198_450.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.cobro_cliente,
      aiConfidence: 0.93,
      matchStatus: MatchStatus.confirmed,
      matchedInvoiceId: "inv-11",
    },
    {
      id: "tx-25",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-28"),
      description: "ACREDITACION INTERES PLAZO FIJO VTO 28/03/2026",
      amount: 12_350.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.otros,
      aiConfidence: 0.52,
      matchStatus: MatchStatus.unmatched,
    },
    {
      id: "tx-26",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-28"),
      description: "REINTEGRO COMISION COBRADA EN EXCESO MAR/2026",
      amount: 5_420.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.comision_bancaria,
      aiConfidence: 0.71,
      matchStatus: MatchStatus.confirmed,
    },
    {
      id: "tx-27",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-24"),
      description: "ACRED TRF - TIENDAS METRO SRL",
      amount: 156_300.0,
      type: TransactionType.credit,
      aiCategory: TransactionCategory.cobro_cliente,
      aiConfidence: 0.89,
      matchStatus: MatchStatus.confirmed,
      matchedInvoiceId: "inv-15",
    },
    {
      id: "tx-28",
      statementId: "stmt-1",
      transactionDate: new Date("2026-03-06"),
      description: "SEGUROS ARG SA - POLIZA INCENDIO 00456823",
      amount: -47_800.0,
      type: TransactionType.debit,
      aiCategory: TransactionCategory.otros,
      aiConfidence: 0.58,
      matchStatus: MatchStatus.suggested,
      matchedInvoiceId: "inv-17",
    },
  ];

  for (const tx of transactions) {
    await prisma.transaction.upsert({
      where: { id: tx.id },
      update: {},
      create: tx,
    });
  }
  console.log(`✅ Transactions: ${transactions.length} created`);

  // ── Reconciliation Matches ───────────────────────────────────────────────────
  const matches = [
    { id: "match-1", transactionId: "tx-1", invoiceId: "inv-1", confirmedById: adminUser.id, matchType: MatchType.exact, confidenceScore: 0.98, status: MatchStatus.confirmed, statementId: "stmt-1" },
    { id: "match-2", transactionId: "tx-2", invoiceId: "inv-2", confirmedById: adminUser.id, matchType: MatchType.exact, confidenceScore: 0.97, status: MatchStatus.confirmed, statementId: "stmt-1" },
    { id: "match-3", transactionId: "tx-3", invoiceId: "inv-3", confirmedById: adminUser.id, matchType: MatchType.exact, confidenceScore: 0.95, status: MatchStatus.confirmed, statementId: "stmt-1" },
    { id: "match-4", transactionId: "tx-8", invoiceId: "inv-4", confirmedById: adminUser.id, matchType: MatchType.exact, confidenceScore: 0.98, status: MatchStatus.confirmed, statementId: "stmt-1" },
    { id: "match-5", transactionId: "tx-9", invoiceId: "inv-5", confirmedById: adminUser.id, matchType: MatchType.exact, confidenceScore: 0.96, status: MatchStatus.confirmed, statementId: "stmt-1" },
    { id: "match-6", transactionId: "tx-16", invoiceId: "inv-7", confirmedById: adminUser.id, matchType: MatchType.exact, confidenceScore: 0.99, status: MatchStatus.confirmed, statementId: "stmt-1" },
    { id: "match-7", transactionId: "tx-18", invoiceId: "inv-12", confirmedById: adminUser.id, matchType: MatchType.exact, confidenceScore: 0.97, status: MatchStatus.confirmed, statementId: "stmt-1" },
    { id: "match-8", transactionId: "tx-19", invoiceId: "inv-9", confirmedById: adminUser.id, matchType: MatchType.exact, confidenceScore: 0.96, status: MatchStatus.confirmed, statementId: "stmt-1" },
    { id: "match-9", transactionId: "tx-22", invoiceId: "inv-10", confirmedById: adminUser.id, matchType: MatchType.exact, confidenceScore: 0.95, status: MatchStatus.confirmed, statementId: "stmt-1" },
    { id: "match-10", transactionId: "tx-24", invoiceId: "inv-11", confirmedById: adminUser.id, matchType: MatchType.exact, confidenceScore: 0.94, status: MatchStatus.confirmed, statementId: "stmt-1" },
    { id: "match-11", transactionId: "tx-27", invoiceId: "inv-15", confirmedById: adminUser.id, matchType: MatchType.exact, confidenceScore: 0.91, status: MatchStatus.confirmed, statementId: "stmt-1" },
    { id: "match-12", transactionId: "tx-17", invoiceId: "inv-8", matchType: MatchType.partial, confidenceScore: 0.74, status: MatchStatus.suggested, statementId: "stmt-1" },
    { id: "match-13", transactionId: "tx-7", invoiceId: "inv-6", matchType: MatchType.partial, confidenceScore: 0.68, status: MatchStatus.suggested, statementId: "stmt-1" },
    { id: "match-14", transactionId: "tx-20", invoiceId: "inv-16", matchType: MatchType.grouped, confidenceScore: 0.71, status: MatchStatus.suggested, statementId: "stmt-1" },
    { id: "match-15", transactionId: "tx-21", invoiceId: "inv-16", matchType: MatchType.grouped, confidenceScore: 0.69, status: MatchStatus.suggested, statementId: "stmt-1" },
  ];

  for (const m of matches) {
    await prisma.reconciliationMatch.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    });
  }
  console.log(`✅ Reconciliation matches: ${matches.length} created`);

  // ── Classification Rules ──────────────────────────────────────────────────────
  const rules = [
    { pattern: "COMISION.*MANTENIMIENTO", category: TransactionCategory.comision_bancaria, source: RuleSource.ai_generated, timesApplied: 38 },
    { pattern: "SUELDO.*MARZO|SUELDO.*CUIL", category: TransactionCategory.salario, source: RuleSource.user_defined, timesApplied: 31 },
    { pattern: "AFIP.*VEP|AFIP.*RET", category: TransactionCategory.impuesto, source: RuleSource.user_defined, timesApplied: 24 },
    { pattern: "ARBA.*PERCEPCION|PERCEPCION.*IIBB", category: TransactionCategory.percepcion, source: RuleSource.ai_generated, timesApplied: 19 },
    { pattern: "RET.*GANANCIAS.*3RA", category: TransactionCategory.retencion, source: RuleSource.ai_generated, timesApplied: 14 },
    { pattern: "IMP DEBITOS.*LEY 25413", category: TransactionCategory.comision_bancaria, source: RuleSource.ai_generated, timesApplied: 28 },
    { pattern: "EDESUR|EDENOR|LUZ Y FUERZA", category: TransactionCategory.servicio, source: RuleSource.user_defined, timesApplied: 12 },
    { pattern: "COBRO DEBIN|COBRO ECHEQ|ACRED TRF", category: TransactionCategory.cobro_cliente, source: RuleSource.ai_generated, timesApplied: 87 },
    { pattern: "TRF.*SA$|TRF.*SRL$|DEBITO.*SA$", category: TransactionCategory.pago_proveedor, source: RuleSource.ai_generated, timesApplied: 53 },
    { pattern: "DEBITO.*ALQ|INMOBILIARIA", category: TransactionCategory.alquiler, source: RuleSource.user_defined, timesApplied: 9 },
  ];

  for (const rule of rules) {
    await prisma.classificationRule.create({
      data: {
        ...rule,
        orgId: org.id,
        createdBy: adminUser.id,
      },
    });
  }
  console.log(`✅ Classification rules: ${rules.length} created`);

  // ── Reports ───────────────────────────────────────────────────────────────────
  await prisma.report.create({
    data: {
      orgId: org.id,
      statementId: "stmt-2",
      reportType: ReportType.conciliation,
      filePath: "/reports/conciliacion-galicia-feb-2026.pdf",
      totalIncome: 4_712_300.0,
      totalExpense: 3_861_990.25,
      matchedTransactions: 48,
      unmatchedTransactions: 2,
      pendingReview: 2,
      generatedBy: adminUser.id,
    },
  });

  await prisma.report.create({
    data: {
      orgId: org.id,
      statementId: "stmt-2",
      reportType: ReportType.tax_detail,
      filePath: "/reports/impuestos-feb-2026.pdf",
      totalIncome: 4_712_300.0,
      totalExpense: 3_861_990.25,
      matchedTransactions: 48,
      unmatchedTransactions: 2,
      pendingReview: 0,
      generatedBy: adminUser.id,
    },
  });
  console.log(`✅ Reports: 2 created`);

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Credenciales de prueba:");
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Password: FlowForge123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
