export interface JobBOSS2Config {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  tokenUrl: string;
  timeout?: number;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Query parameters for API requests
export interface QueryParams {
  fields?: string;
  sort?: string;
  skip?: number;
  take?: number;
  [key: string]: any; // For dynamic filters
}

// Order interfaces
export interface Order {
  ackPrinted?: boolean;
  addCustomerFromQuote?: boolean;
  allowExpiredQuoteItems?: boolean;
  country?: string | null;
  currencyCode?: string | null;
  customerCode?: string | null;
  customerDescription?: string | null;
  dateEntered?: string | null;
  dateEnteredLabel?: string | null;
  dueDate?: string | null;
  enteredBy?: string | null;
  exchangeRate?: number | null;
  fax?: string | null;
  GSTCode?: string | null;
  holdUntilAccountIsCurrent?: boolean;
  JTPrinted?: boolean;
  lastModDate?: string | null;
  lastModUser?: string | null;
  location?: string | null;
  mainDueDate?: string | null;
  mainPriority?: number | null;
  markCustomerActive?: boolean;
  notesToCustomer?: string | null;
  orderNumber?: string | null;
  orderTotal?: number | null;
  orderTotalForeign?: number | null;
  phone?: string | null;
  PONumber?: string | null;
  purchasingContact?: string | null;
  quoteNumber?: string | null;
  salesID?: string | null;
  saveOnDuplicateCustomerPONumber?: boolean;
  shippingAddress1?: string | null;
  shippingCity?: string | null;
  shippingCode?: string | null;
  shippingState?: string | null;
  shipToName?: string | null;
  shipVia?: string | null;
  shipZIP?: string | null;
  status?: string | null;
  taxCode?: string | null;
  termsCode?: string | null;
  territory?: string | null;
  uniqueID?: number;
  user_Currency1?: number | null;
  user_Currency2?: number | null;
  user_Date1?: string | null;
  user_Date2?: string | null;
  user_Memo1?: string | null;
  user_Number1?: number | null;
  user_Number2?: number | null;
  user_Number3?: number | null;
  user_Number4?: number | null;
  user_Text1?: string | null;
  user_Text2?: string | null;
  user_Text3?: string | null;
  user_Text4?: string | null;
  WOPrinted?: boolean;
}

// Order Line Item interfaces
export interface OrderLineItem {
  actualEndDate?: string | null;
  actualStartDate?: string | null;
  billingRate?: number | null;
  commissionPercent?: number | null;
  cumulativeBilling?: number | null;
  currentWorkCenter?: string | null;
  dateFinished?: string | null;
  discountPercent?: number | null;
  dueDate?: string | null;
  estimatedEndDate?: string | null;
  estimatedStartDate?: string | null;
  FOB?: string | null;
  isJobLabelPrinted?: boolean;
  isScheduled?: boolean;
  isTaxable?: boolean;
  itemNumber?: number | null;
  jobNotes?: string | null;
  jobNumber?: string | null;
  jobOnHold?: boolean;
  lastModDate?: string | null;
  lastModUser?: string | null;
  masterJobNumber?: string | null;
  masterStepNumber?: number | null;
  miscCharges?: number | null;
  miscChargesBilled?: boolean;
  miscChargesForeign?: number | null;
  miscDescription?: string | null;
  orderNumber?: string | null;
  overlapSteps?: boolean;
  partDescription?: string | null;
  partNumber?: string | null;
  pricingUnit?: string | null;
  priority?: number | null;
  productCode?: string | null;
  quantityCanceled?: number | null;
  quantityOrdered?: number | null;
  quantityShippedToCustomer?: number | null;
  quantityShippedToStock?: number | null;
  quantityToMake?: number | null;
  quantityToStock?: number | null;
  quoteItemNumber?: number | null;
  quoteNumber?: string | null;
  revision?: string | null;
  scheduleLocked?: boolean;
  status?: string | null;
  tempPriority?: number | null;
  totalActualHours?: number | null;
  totalEstimatedHours?: number | null;
  travelerPrinted?: boolean;
  uniqueID?: number;
  unitPrice?: number | null;
  unitPriceForeign?: number | null;
  user_Currency1?: number | null;
  user_Currency2?: number | null;
  user_Date1?: string | null;
  user_Date2?: string | null;
  user_Memo1?: string | null;
  user_Number1?: number | null;
  user_Number2?: number | null;
  user_Number3?: number | null;
  user_Number4?: number | null;
  user_Text1?: string | null;
  user_Text2?: string | null;
  user_Text3?: string | null;
  user_Text4?: string | null;
  workCode?: string | null;
  [key: string]: any;
}

export interface OrderLineItemUpdate {
  user_Currency1?: number | null;
  user_Currency2?: number | null;
  user_Date1?: string | null;
  user_Date2?: string | null;
  user_Memo1?: string | null;
  user_Number1?: number | null;
  user_Number2?: number | null;
  user_Number3?: number | null;
  user_Number4?: number | null;
  user_Text1?: string | null;
  user_Text2?: string | null;
  user_Text3?: string | null;
  user_Text4?: string | null;
  [key: string]: any;
}

export interface OrderRouting {
  actualEndDate?: string | null;
  actualPiecesGood?: number | null;
  actualPiecesScrap?: number | null;
  actualStartDate?: string | null;
  burdenRate?: number | null;
  certificationRequired?: boolean;
  cost1?: number | null;
  cost2?: number | null;
  cost3?: number | null;
  cost4?: number | null;
  cost5?: number | null;
  cost6?: number | null;
  cost7?: number | null;
  cost8?: number | null;
  cyclePrice?: number | null;
  cycleRate?: number | null;
  cycleTime?: number | null;
  cycleUnit?: string | null;
  departmentNumber?: string | null;
  description?: string | null;
  employeeCode?: string | null;
  estimatedEndDate?: string | null;
  estimatedQuantity?: number | null;
  estimatedStartDate?: string | null;
  GLCode?: string | null;
  ignoreVendorMinimum?: boolean;
  itemNumber?: number | null;
  jobNumber?: string | null;
  laborAccount?: string | null;
  laborRate?: number | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  leadTime?: number | null;
  machinesRun?: number | null;
  markupPercent?: number | null;
  numberMachinesForJob?: number | null;
  operationCode?: string | null;
  orderNumber?: string | null;
  overlapSteps?: boolean;
  partNumber?: string | null;
  percentEfficient?: number | null;
  scrapPercent?: number | null;
  setup1?: number | null;
  setup2?: number | null;
  setup3?: number | null;
  setup4?: number | null;
  setup5?: number | null;
  setup6?: number | null;
  setup7?: number | null;
  setup8?: number | null;
  setupPrice?: number | null;
  setupRate?: number | null;
  setupTime?: number | null;
  shift2DefaultEmployeeCode?: string | null;
  shift3DefaultEmployeeCode?: string | null;
  status?: string | null;
  stepNumber?: number | null;
  teamSize?: number | null;
  tempEstimatedEndDate?: string | null;
  tempEstimatedStartDate?: string | null;
  timeUnit?: string | null;
  total?: number | null;
  totalActualHours?: number | null;
  totalEstimatedHours?: number | null;
  totalHoursLeft?: number | null;
  unattendedOperation?: boolean;
  uniqueID?: number;
  unit1?: string | null;
  unit2?: string | null;
  unit3?: string | null;
  unit4?: string | null;
  unit5?: string | null;
  unit6?: string | null;
  unit7?: string | null;
  unit8?: string | null;
  vendorCode?: string | null;
  workCenter?: string | null;
  workCenterOrVendor?: string | null;
  [key: string]: any;
}

export interface OrderRoutingCreate {
  certificationRequired?: boolean;
  cyclePrice?: number | null;
  cycleTime?: number | null;
  cycleUnit?: string | null;
  departmentNumber?: string | null;
  description?: string | null;
  employeeCode?: string | null;
  estimatedEndDate?: string | null;
  estimatedQuantity?: number | null;
  estimatedStartDate?: string | null;
  ignoreVendorMinimum?: boolean;
  operationCode?: string | null;
  overlapSteps?: boolean;
  setupPrice?: number | null;
  setupTime?: number | null;
  shift2DefaultEmployeeCode?: string | null;
  shift3DefaultEmployeeCode?: string | null;
  stepNumber?: number | null;
  timeUnit?: string | null;
  total?: number | null;
  vendorCode?: string | null;
  workCenter?: string | null;
  workCenterOrVendor: string;
  [key: string]: any;
}

export interface OrderRoutingUpdate {
  operationCode?: string | null;
  employeeCode?: string | null;
  estimatedEndDate?: string | null;
  estimatedStartDate?: string | null;
  workCenter?: string | null;
  [key: string]: any;
}

// Customer interfaces
export interface Customer {
  customerCode: string;
  customerName: string;
  active?: boolean;
  phone?: string;
  salesID?: string;
  creditLimit?: number;
  currencyCode?: string;
  termsCode?: string;
  uniqueID?: number;
  billingAddress1?: string;
  billingCity?: string;
  billingState?: string;
  billingZIPCode?: string;
  contact1?: string;
  lastModDate?: string;
  [key: string]: any;
}

// Quote interfaces
export interface Quote {
  quoteNumber: string;
  customerCode: string;
  dateEntered?: string;
  expirationDate?: string;
  status?: string;
  quoteTotal?: number;
  salesID?: string;
  uniqueID?: number;
  [key: string]: any;
}

// Bin Location interfaces
export interface BinLocation {
  binLocation?: string | null;
  cost?: number | null;
  datePosted?: string | null;
  deliveryTicketNumber?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  lotNumber?: string | null;
  partNumber?: string | null;
  POItemNumber?: number | null;
  quantityOnHand?: number | null;
  receiverNumber?: string | null;
  uniqueID?: number;
  vendorCode?: string | null;
  [key: string]: any;
}

// Material interfaces
export interface Material {
  description?: string | null;
  enteredDate?: string | null;
  isPurchased?: boolean;
  itemNumber?: number | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  materialDetailID?: string | null;
  partNumber?: string | null;
  partWeight?: number | null;
  quantity?: number | null;
  revisedDate?: string | null;
  stepNumber?: number | null;
  subPartNumber?: string | null;
  totalCost?: number | null;
  totalPrice?: number | null;
  totalQuantity?: number | null;
  totalWeight?: number | null;
  uniqueID?: number;
  unit?: string | null;
  unitCost?: number | null;
  unitPrice?: number | null;
  vendor?: string | null;
  [key: string]: any;
}

export interface MaterialCreate {
  description?: string | null;
  materialDetailID?: string | null;
  partWeight?: number | null;
  quantity?: number | null;
  stepNumber?: number | null;
  subPartNumber: string;
  unit?: string | null;
  unitCost?: number | null;
  unitPrice?: number | null;
  vendor?: string | null;
  [key: string]: any;
}

// Employee interfaces
export interface Employee {
  employeeID: string;
  name?: string;
  departmentID?: string;
  active?: boolean;
  uniqueID?: number;
  [key: string]: any;
}

// Estimate interfaces (Part Master)
export interface Estimate {
  accountingID?: string | null;
  active?: boolean;
  alternatePartNumber?: string | null;
  billingRate?: number | null;
  bin1Lot?: string | null;
  bin2Lot?: string | null;
  bin3Lot?: string | null;
  bin4Lot?: string | null;
  bin5Lot?: string | null;
  binLocation1?: string | null;
  binLocation2?: string | null;
  binLocation3?: string | null;
  binLocation4?: string | null;
  binLocation5?: string | null;
  binQuantity1?: number | null;
  binQuantity2?: number | null;
  binQuantity3?: number | null;
  binQuantity4?: number | null;
  binQuantity5?: number | null;
  calculationMethod?: string | null;
  comments?: string | null;
  commissionPercent?: number | null;
  customerCode?: string | null;
  defaultBinLocation?: string | null;
  description?: string | null;
  drawingFileName?: string | null;
  drawingNumber?: string | null;
  enteredBy?: string | null;
  enteredDate?: string | null;
  GLCode?: string | null;
  imageRepositoryID?: number | null;
  inspectCustomerReturns?: boolean | null;
  inspectInternalRejections?: boolean | null;
  inspectOrders?: boolean | null;
  inspectReceivers?: boolean | null;
  isTaxable?: boolean;
  lastDeliveryTicketDate?: string | null;
  lastDeliveryTicketNumber?: string | null;
  lastDeliveryTicketQuantity?: number | null;
  lastJobDate?: string | null;
  lastJobDateFinished?: string | null;
  lastJobNumber?: string | null;
  lastJobPrice?: number | null;
  lastJobQuantity?: number | null;
  lastJobQuoteNumber?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  lastPriceChange?: string | null;
  lastPurchaseOrderCost?: number | null;
  lastPurchaseOrderDate?: string | null;
  lastPurchaseOrderNumber?: string | null;
  lastPurchaseOrderQuantity?: number | null;
  leadTime?: number | null;
  lockPrice?: boolean;
  markup1?: number | null;
  markup2?: number | null;
  markup3?: number | null;
  markup4?: number | null;
  markup5?: number | null;
  markup6?: number | null;
  markup7?: number | null;
  markup8?: number | null;
  markupPercent?: number | null;
  matchQuantityBreaks?: boolean;
  miscCharge?: number | null;
  miscDescription?: string | null;
  partNumber?: string | null;
  partWeight?: number | null;
  price1?: number | null;
  price2?: number | null;
  price3?: number | null;
  price4?: number | null;
  price5?: number | null;
  price6?: number | null;
  price7?: number | null;
  price8?: number | null;
  pricingUnit?: string | null;
  printed?: boolean;
  productCode?: string | null;
  purchaseCost1?: number | null;
  purchaseCost2?: number | null;
  purchaseCost3?: number | null;
  purchaseCost4?: number | null;
  purchaseCost5?: number | null;
  purchaseCost6?: number | null;
  purchaseCost7?: number | null;
  purchaseCost8?: number | null;
  purchaseFactor?: number | null;
  purchaseQuantity1?: number | null;
  purchaseQuantity2?: number | null;
  purchaseQuantity3?: number | null;
  purchaseQuantity4?: number | null;
  purchaseQuantity5?: number | null;
  purchaseQuantity6?: number | null;
  purchaseQuantity7?: number | null;
  purchaseQuantity8?: number | null;
  purchasingGLCode?: string | null;
  purchasingUnit?: string | null;
  QBItemType?: string | null;
  quantity1?: number | null;
  quantity2?: number | null;
  quantity3?: number | null;
  quantity4?: number | null;
  quantity5?: number | null;
  quantity6?: number | null;
  quantity7?: number | null;
  quantity8?: number | null;
  quantityOnHand?: string | null;
  quantityOnOrder?: number | null;
  quantityOutside?: number | null;
  reOrderLevel?: number | null;
  reOrderQuantity?: number | null;
  revisedDate?: string | null;
  revision?: string | null;
  revisionDate?: string | null;
  routeDate?: string | null;
  routeEmployee?: string | null;
  stockingCost?: number | null;
  stockUnit?: string | null;
  uniqueID?: number;
  useDefaultQuantities?: boolean;
  user_Currency1?: number | null;
  user_Currency2?: number | null;
  user_Date1?: string | null;
  user_Date2?: string | null;
  user_Memo1?: string | null;
  user_Number1?: number | null;
  user_Number2?: number | null;
  user_Number3?: number | null;
  user_Number4?: number | null;
  user_Text1?: string | null;
  user_Text2?: string | null;
  user_Text3?: string | null;
  user_Text4?: string | null;
  vendorCode1?: string | null;
  vendorCode2?: string | null;
  vendorCode3?: string | null;
  materials?: MaterialCreate[] | null;
  routings?: RoutingCreate[] | null;
  [key: string]: any;
}

export interface DocumentControl {
  approvalComments?: string | null;
  approvalDate?: string | null;
  approvedBy?: string | null;
  dateEntered?: string | null;
  description?: string | null;
  documentDate?: string | null;
  documentNumber?: string | null;
  documentStatus?: string | null;
  documentType?: string | null;
  enteredBy?: string | null;
  fileLocation?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  printed?: boolean | null;
  proposalComments?: string | null;
  proposalDate?: string | null;
  proposedBy?: string | null;
  releaseComments?: string | null;
  releaseDate?: string | null;
  releasedBy?: string | null;
  repositoryID?: string | null;
  retiredBy?: string | null;
  retirementComments?: string | null;
  retirementDate?: string | null;
  revision?: string | null;
  revisionDate?: string | null;
  uniqueID?: number | null;
  [key: string]: any;
}

export interface DocumentHistory {
  comments?: string | null;
  documentNumber?: string | null;
  fileLocation?: string | null;
  repositoryID?: string | null;
  revision?: string | null;
  revisionDate?: string | null;
  spunOffFile?: string | null;
  uniqueID?: number | null;
  updatedJobs?: string | null;
  updatedParts?: string | null;
  userID?: string | null;
  [key: string]: any;
}

export interface DocumentReviewRecord {
  completed?: boolean | null;
  cost?: number | null;
  description?: string | null;
  documentNumber?: string | null;
  employeeCode?: string | null;
  endDate?: string | null;
  invoiceNumber?: string | null;
  jobNumber?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  reviewCode?: string | null;
  startDate?: string | null;
  uniqueID?: number | null;
  vendorCode?: string | null;
  [key: string]: any;
}

export interface JobMaterial {
  binLocation1?: string | null;
  binLocation2?: string | null;
  binLocation3?: string | null;
  binLocation4?: string | null;
  binLocation5?: string | null;
  binLocationCounter?: number | null;
  datePosted?: string | null;
  description?: string | null;
  GLCode?: string | null;
  jobNumber?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  lotNumber1?: string | null;
  lotNumber2?: string | null;
  lotNumber3?: string | null;
  lotNumber4?: string | null;
  lotNumber5?: string | null;
  mainPart?: boolean | null;
  manufacturingJobNumber?: string | null;
  orderNumber?: string | null;
  originalBinCost?: number | null;
  outsideService?: boolean | null;
  packingListDate?: string | null;
  packingListNumber?: string | null;
  partNumber?: string | null;
  PODate?: string | null;
  POItemNumber?: number | null;
  PONumber?: string | null;
  postedBy?: string | null;
  postedFromStock?: boolean | null;
  pricingUnit?: string | null;
  productCode?: string | null;
  quantityPosted1?: number | null;
  quantityPosted2?: number | null;
  quantityPosted3?: number | null;
  quantityPosted4?: number | null;
  quantityPosted5?: number | null;
  receiverDate?: string | null;
  receiverNumber?: string | null;
  resalePrice?: number | null;
  stepNumber?: number | null;
  stockingCost?: number | null;
  stockUnit?: string | null;
  subAssemblyJobNumber?: string | null;
  uniqueID?: number | null;
  vendorCode?: string | null;
  vendorInvoiceNumber?: string | null;
  vendorType?: string | null;
  [key: string]: any;
}

export interface JobRequirement {
  certificationRequired?: boolean | null;
  cost?: number | null;
  dateProcessed?: string | null;
  GLCode?: string | null;
  jobDue?: string | null;
  jobNumber?: string | null;
  uniqueID?: number | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  leadTime?: number | null;
  orderNumber?: string | null;
  outsideService?: boolean | null;
  partDescription?: string | null;
  partNumber?: string | null;
  PODate?: string | null;
  POItemNumber?: number | null;
  PONumber?: string | null;
  price?: number | null;
  pricingUnit?: string | null;
  productCode?: string | null;
  purchaseQuantity?: number | null;
  purchaseUnit?: string | null;
  quantityToBuy?: number | null;
  setupCharge?: number | null;
  stepNumber?: number | null;
  stockingUnit?: string | null;
  temporaryJobDue?: string | null;
  vendorCode?: string | null;
  workCode?: string | null;
  [key: string]: any;
}

export interface PackingListLineItem {
  accountingID?: string | null;
  contactName?: string | null;
  containerNumber?: string | null;
  customerPONumber?: string | null;
  deliveryTicketItemNumber?: string | null;
  deliveryTicketNumber?: string | null;
  isTaxable?: boolean | null;
  jobNumber?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  masterJobNumber?: string | null;
  partDescription?: string | null;
  partNumber?: string | null;
  partWeight?: number | null;
  quantityFromStock?: number | null;
  quantityOpen?: number | null;
  quantityToCancel?: number | null;
  quantityToShip?: number | null;
  quantityToStock?: number | null;
  revision?: string | null;
  uniqueID?: number | null;
  unit?: string | null;
  [key: string]: any;
}

export interface PackingList {
  accountingID?: string | null;
  autoBill?: boolean | null;
  certificatePrinted?: boolean | null;
  CODAmount?: number | null;
  CODAmountPrepaid?: boolean | null;
  CODFee?: number | null;
  CODFeePrepaid?: boolean | null;
  containerOption?: number | null;
  containerUnit?: string | null;
  containerWeight?: number | null;
  country?: string | null;
  customerCode?: string | null;
  customerDescription?: string | null;
  customerPONumber?: string | null;
  dateEntered?: string | null;
  deliveryTicketNumber?: string | null;
  descriptionOfContents?: string | null;
  enteredBy?: string | null;
  exported?: boolean | null;
  exportedToEDI?: boolean | null;
  freightCharge?: number | null;
  freightChargePrepaid?: boolean | null;
  freightTerms?: string | null;
  freightVendorCode?: string | null;
  handlingCharge?: number | null;
  isProcessed?: number | null;
  isShipmentFromSystem?: boolean | null;
  labelPrinted?: boolean | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  location?: string | null;
  notesToCustomer?: string | null;
  numberOfContainers?: number | null;
  orderNumber?: string | null;
  packingListPrinted?: boolean | null;
  remitAddress1?: string | null;
  remitCity?: string | null;
  remitCountry?: string | null;
  remitName?: string | null;
  remitStreet?: string | null;
  remitZIP?: string | null;
  shippingAddress1?: string | null;
  shippingCharges?: number | null;
  shippingCity?: string | null;
  shippingCode?: string | null;
  shippingDate?: string | null;
  shippingStreet?: string | null;
  shippingToName?: string | null;
  shippingVia?: string | null;
  shippingZIP?: string | null;
  specialInstructions?: string | null;
  status?: string | null;
  uniqueID?: number | null;
  vendorDescription?: string | null;
  weightOfParts?: number | null;
  [key: string]: any;
}

export interface ProductCode {
  active?: boolean | null;
  ARAccount?: string | null;
  cashDiscount?: string | null;
  description?: string | null;
  enteredDate?: string | null;
  freightAccount?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  productCode?: string | null;
  salesAccount?: string | null;
  uniqueID?: number | null;
  [key: string]: any;
}

export interface PurchaseOrderLineItem {
  comments?: string | null;
  dateFinished?: string | null;
  dueDate?: string | null;
  FOB?: string | null;
  GLCode?: string | null;
  itemNumber?: number | null;
  jobNumber?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  outsideService?: boolean | null;
  partDescription?: string | null;
  partNumber?: string | null;
  purchaseOrderNumber?: string | null;
  quantityCanceled?: number | null;
  quantityOrdered?: number | null;
  quantityReceived?: number | null;
  quantityRejected?: number | null;
  revision?: string | null;
  status?: string | null;
  stepNumber?: number | null;
  uniqueID?: number | null;
  unit?: string | null;
  unitCost?: number | null;
  unitCostForeign?: number | null;
  [key: string]: any;
}

export interface PurchaseOrderRelease {
  comments?: string | null;
  dateReceived?: string | null;
  dueDate?: string | null;
  itemNumber?: number | null;
  jobNumber?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  partNumber?: string | null;
  PONumber?: string | null;
  quantity?: number | null;
  quantityCanceled?: number | null;
  quantityRejected?: number | null;
  receiverNumber?: string | null;
  uniqueID?: number | null;
  [key: string]: any;
}

export interface PurchaseOrder {
  contact?: string | null;
  currencyCode?: string | null;
  dateComplete?: string | null;
  dateEntered?: string | null;
  dateRequired?: string | null;
  enteredBy?: string | null;
  exchangeRate?: number | null;
  fax?: string | null;
  GSTCharges?: number | null;
  GSTCode?: string | null;
  ignoreMinimumOrder?: boolean | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  notesToVendor?: string | null;
  phone?: string | null;
  PONumber?: string | null;
  POTotal?: number | null;
  POTotalForeign?: number | null;
  purchasedBy?: string | null;
  shipCode?: string | null;
  shippingAddress1?: string | null;
  shippingCity?: string | null;
  shippingCountry?: string | null;
  shippingStreet?: string | null;
  shippingZip?: string | null;
  shipToName?: string | null;
  shipVia?: string | null;
  status?: string | null;
  termsCode?: string | null;
  uniqueID?: number | null;
  vendorCode?: string | null;
  vendorDescription?: string | null;
  vendorQuoteNumber?: string | null;
  vendorType?: string | null;
  [key: string]: any;
}

export interface QuoteLineItem {
  commissionPercent?: number | null;
  delivery?: string | null;
  description?: string | null;
  discountPercent?: number | null;
  FOB?: string | null;
  isTaxable?: boolean | null;
  itemNumber?: number | null;
  jobNotes?: string | null;
  jobNumber?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  miscCharge?: number | null;
  miscChargeForeign?: number | null;
  miscDescription?: string | null;
  partNumber?: string | null;
  price1?: number | null;
  price2?: number | null;
  price3?: number | null;
  price4?: number | null;
  price5?: number | null;
  price6?: number | null;
  price7?: number | null;
  price8?: number | null;
  priceForeign1?: number | null;
  priceForeign2?: number | null;
  priceForeign3?: number | null;
  priceForeign4?: number | null;
  priceForeign5?: number | null;
  priceForeign6?: number | null;
  priceForeign7?: number | null;
  priceForeign8?: number | null;
  quantity1?: number | null;
  quantity2?: number | null;
  quantity3?: number | null;
  quantity4?: number | null;
  quantity5?: number | null;
  quantity6?: number | null;
  quantity7?: number | null;
  quantity8?: number | null;
  quoteNumber?: string | null;
  quotePart?: string | null;
  revision?: string | null;
  status?: string | null;
  uniqueID?: number | null;
  unit1?: string | null;
  unit2?: string | null;
  unit3?: string | null;
  unit4?: string | null;
  unit5?: string | null;
  unit6?: string | null;
  unit7?: string | null;
  unit8?: string | null;
  workCode?: string | null;
  [key: string]: any;
}

export interface ReportSubmissionResult {
  requestId?: string;
  status?: string;
  [key: string]: any;
}

export interface Salesperson {
  active?: boolean | null;
  address1?: string | null;
  city?: string | null;
  commissionAccount?: string | null;
  commissionPercent?: number | null;
  country?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  name?: string | null;
  phone?: string | null;
  salesID?: string | null;
  state?: string | null;
  uniqueID?: number | null;
  YTDCommission?: number | null;
  YTDSales?: number | null;
  zipCode?: string | null;
  [key: string]: any;
}

export interface TimeTicketDetail {
  actualPayRate?: number | null;
  billingRate?: number | null;
  comments?: string | null;
  cycleTime?: number | null;
  employeeCode?: number | null;
  employeeName?: string | null;
  jobNumber?: string | null;
  machineHours?: number | null;
  machinesRun?: number | null;
  manHours?: number | null;
  numberMachinesForJob?: number | null;
  operationNumber?: string | null;
  payrollRate?: number | null;
  piecesFinished?: number | null;
  piecesScrapped?: number | null;
  setupTime?: number | null;
  shift?: number | null;
  stepNumber?: number | null;
  ticketDate?: string | null;
  timeTicketGUID?: string | null;
  uniqueID?: number | null;
  workCenter?: string | null;
  [key: string]: any;
}

export interface TimeTicket {
  employeeCode?: number | null;
  employeeName?: string | null;
  enteredBy?: string | null;
  enteredDate?: string | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  searchDate?: number | null;
  ticketDate?: string | null;
  uniqueID?: number | null;
  [key: string]: any;
}

export interface Vendor {
  active?: boolean | null;
  currencyCode?: string | null;
  enteredDate?: string | null;
  federalIDNumber?: string | null;
  GLAccount1?: string | null;
  lastModDate?: string | null;
  leadTime?: number | null;
  termsCode?: string | null;
  uniqueID?: number | null;
  vendorAccountNumber?: string | null;
  vendorCode?: string | null;
  vendorName?: string | null;
  vendorType?: string | null;
  [key: string]: any;
}

export interface WorkCenter {
  active?: boolean | null;
  attendanceCode?: string | null;
  burdenRate?: number | null;
  capacityFactor?: number | null;
  comments?: string | null;
  departmentNumber?: string | null;
  description?: string | null;
  laborAccount?: string | null;
  laborRate?: number | null;
  lastModDate?: string | null;
  lastModUser?: string | null;
  operationCode?: string | null;
  queueTime?: number | null;
  queueUnit?: string | null;
  shortName?: string | null;
  uniqueID?: number | null;
  workCenter?: string | null;
  [key: string]: any;
}

export interface RoutingCreate {
  cycleTime?: number | null;
  cycleUnit?: string | null;
  description?: string | null;
  operatorCode?: string | null;
  setupTime?: number | null;
  stepNumber?: number | null;
  timeUnit?: string | null;
  vendorCode?: string | null;
  workCenter?: string | null;
  workOrVendor?: string | null;
  [key: string]: any;
}



// Attendance Ticket interfaces
export interface AttendanceTicket {
  employeeCode: number;
  ticketDate: string;
  employeeName?: string;
  enteredBy?: string;
  enteredDate?: string;
  isExported?: boolean;
  lastModDate?: string;
  lastModUser?: string;
  searchDate?: number;
  uniqueID?: number;
  [key: string]: any;
}

export interface AttendanceTicketDetail {
  uniqueID?: number;
  employeeCode?: number;
  employeeName?: string;
  ticketDate?: string;
  accountingID?: string;
  actualClockInDate?: string;
  actualClockInTime?: string;
  actualClockOutDate?: string;
  actualClockOutTime?: string;
  adjustedClockInDate?: string;
  adjustedClockInTime?: string;
  adjustedClockOutDate?: string;
  adjustedClockOutTime?: string;
  attendanceCode?: number;
  clockOutDate?: string;
  comments?: string;
  createdBy?: string;
  deviceNumber?: number;
  GLCode?: string;
  isHoliday?: boolean;
  isOvertime?: boolean;
  lastModDate?: string;
  lastModUser?: string;
  OTCalcFlag?: string;
  payRateCode?: number;
  payRollRate?: number;
  searchDate?: number;
  shift?: number;
  totalActualTime?: number;
  totalAdjustedTime?: number;
  [key: string]: any;
}
