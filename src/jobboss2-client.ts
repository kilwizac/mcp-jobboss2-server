import axios, { AxiosInstance, AxiosError } from 'axios';

export interface JobBOSS2Config {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  tokenUrl: string;
  timeout?: number;
}

interface OAuthTokenResponse {
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
  orderNumber: string;
  customerCode: string;
  customerDescription?: string;
  dateEntered?: string;
  dueDate?: string;
  lastModDate?: string;
  orderTotal?: number;
  orderTotalForeign?: number;
  PONumber?: string;
  salesID?: string;
  status?: string;
  termsCode?: string;
  territory?: string;
  uniqueID?: number;
  [key: string]: any; // For additional fields
}

// Order Line Item interfaces
export interface OrderLineItem {
  itemNumber: number;
  orderNumber: string;
  partNumber?: string;
  description?: string;
  quantity?: number;
  price?: number;
  dueDate?: string;
  status?: string;
  uniqueID?: number;
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

// Quote Line Item interfaces
export interface QuoteLineItem {
  itemNumber: number;
  quoteNumber: string;
  partNumber?: string;
  description?: string;
  quantity?: number;
  price1?: number;
  uniqueID?: number;
  [key: string]: any;
}

// Material interfaces
export interface Material {
  partNumber: string;
  description?: string;
  quantityOnHand?: number;
  unitCost?: number;
  productCode?: string;
  uniqueID?: number;
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
  partNumber: string;
  description?: string;
  active?: boolean;
  alternatePartNumber?: string;
  calculationMethod?: string;
  customerCode?: string;
  GLCode?: string;
  leadTime?: number;
  productCode?: string;
  purchaseFactor?: number;
  purchasingGLCode?: string;
  purchasingUnit?: string;
  pricingUnit?: string;
  revision?: string;
  stockingCost?: number;
  partWeight?: number;
  uniqueID?: number;
  materials?: MaterialCreate[];
  routings?: RoutingCreate[];
  [key: string]: any;
}

export interface MaterialCreate {
  subPartNumber: string;
  description?: string;
  materialDetailID?: string;
  partWeight?: number;
  quantity?: number;
  stepNumber?: number;
  unit?: string;
  unitCost?: number;
  unitPrice?: number;
  vendor?: string;
}

export interface RoutingCreate {
  stepNumber: number;
  cycleTime?: number;
  cycleUnit?: string;
  description?: string;
  operatorCode?: string;
  setupTime?: number;
  timeUnit?: string;
  vendorCode?: string;
  workCenter?: string;
  workOrVendor?: string;
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

export class JobBOSS2Client {
  private client: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private tokenUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: JobBOSS2Config) {
    this.apiKey = config.apiKey;
    this.apiSecret = config.apiSecret;
    this.tokenUrl = config.tokenUrl;

    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      async (config) => {
        // Ensure we have a valid access token
        await this.ensureValidToken();

        // Add Bearer token authentication
        if (this.accessToken) {
          config.headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          throw new Error(
            `JobBOSS2 API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`
          );
        } else if (error.request) {
          throw new Error('JobBOSS2 API: No response received from server');
        } else {
          throw new Error(`JobBOSS2 API Error: ${error.message}`);
        }
      }
    );
  }

  // OAuth2 Token Management
  private async fetchAccessToken(): Promise<void> {
    try {
      const response = await axios.post<OAuthTokenResponse>(
        this.tokenUrl,
        new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.apiKey,
          client_secret: this.apiSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry for safety
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `OAuth2 Token Error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`
        );
      }
      throw error;
    }
  }

  private isTokenExpired(): boolean {
    return !this.accessToken || Date.now() >= this.tokenExpiry;
  }

  private async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired()) {
      await this.fetchAccessToken();
    }
  }

  // Helper method to extract data from API response
  private extractData(response: any): any {
    // JobBOSS2 API wraps responses in a "Data" property
    return response.data?.Data ?? response.data;
  }

  // Order Operations
  async getOrders(params?: QueryParams): Promise<Order[]> {
    const response = await this.client.get('/api/v1/orders', { params });
    return this.extractData(response);
  }

  async getOrderById(orderNumber: string, params?: QueryParams): Promise<Order> {
    const response = await this.client.get(`/api/v1/orders/${orderNumber}`, { params });
    return this.extractData(response);
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    const response = await this.client.post('/api/v1/orders', orderData);
    return this.extractData(response);
  }

  async updateOrder(orderNumber: string, orderData: Partial<Order>): Promise<Order> {
    const response = await this.client.patch(`/api/v1/orders/${orderNumber}`, orderData);
    return this.extractData(response);
  }

  // Order Line Item Operations
  async getOrderLineItems(orderNumber: string, params?: QueryParams): Promise<OrderLineItem[]> {
    const response = await this.client.get(`/api/v1/orders/${orderNumber}/order-line-items`, { params });
    return this.extractData(response);
  }

  async getOrderLineItemById(orderNumber: string, itemNumber: number, params?: QueryParams): Promise<OrderLineItem> {
    const response = await this.client.get(`/api/v1/orders/${orderNumber}/order-line-items/${itemNumber}`, { params });
    return this.extractData(response);
  }

  async createOrderLineItem(orderNumber: string, itemData: Partial<OrderLineItem>): Promise<OrderLineItem> {
    const response = await this.client.post(`/api/v1/orders/${orderNumber}/order-line-items`, itemData);
    return this.extractData(response);
  }

  async updateOrderLineItem(orderNumber: string, itemNumber: number, itemData: Partial<OrderLineItem>): Promise<OrderLineItem> {
    const response = await this.client.patch(`/api/v1/orders/${orderNumber}/order-line-items/${itemNumber}`, itemData);
    return this.extractData(response);
  }

  // Customer Operations
  async getCustomers(params?: QueryParams): Promise<Customer[]> {
    const response = await this.client.get('/api/v1/customers', { params });
    return this.extractData(response);
  }

  async getCustomerById(customerCode: string, params?: QueryParams): Promise<Customer> {
    const response = await this.client.get(`/api/v1/customers/${customerCode}`, { params });
    return this.extractData(response);
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    const response = await this.client.post('/api/v1/customers', customerData);
    return this.extractData(response);
  }

  async updateCustomer(customerCode: string, customerData: Partial<Customer>): Promise<Customer> {
    const response = await this.client.patch(`/api/v1/customers/${customerCode}`, customerData);
    return this.extractData(response);
  }

  // Quote Operations
  async getQuotes(params?: QueryParams): Promise<Quote[]> {
    const response = await this.client.get('/api/v1/quotes', { params });
    return this.extractData(response);
  }

  async getQuoteById(quoteNumber: string, params?: QueryParams): Promise<Quote> {
    const response = await this.client.get(`/api/v1/quotes/${quoteNumber}`, { params });
    return this.extractData(response);
  }

  async createQuote(quoteData: Partial<Quote>): Promise<Quote> {
    const response = await this.client.post('/api/v1/quotes', quoteData);
    return this.extractData(response);
  }

  async updateQuote(quoteNumber: string, quoteData: Partial<Quote>): Promise<Quote> {
    const response = await this.client.patch(`/api/v1/quotes/${quoteNumber}`, quoteData);
    return this.extractData(response);
  }

  // Quote Line Item Operations
  async getQuoteLineItems(quoteNumber: string, params?: QueryParams): Promise<QuoteLineItem[]> {
    const response = await this.client.get(`/api/v1/quotes/${quoteNumber}/quote-line-items`, { params });
    return this.extractData(response);
  }

  async getQuoteLineItemById(quoteNumber: string, itemNumber: number, params?: QueryParams): Promise<QuoteLineItem> {
    const response = await this.client.get(`/api/v1/quotes/${quoteNumber}/quote-line-items/${itemNumber}`, { params });
    return this.extractData(response);
  }

  // Material Operations
  async getMaterials(params?: QueryParams): Promise<Material[]> {
    const response = await this.client.get('/api/v1/materials', { params });
    return this.extractData(response);
  }

  async getMaterialByPartNumber(partNumber: string, params?: QueryParams): Promise<Material> {
    const response = await this.client.get(`/api/v1/materials/${partNumber}`, { params });
    return this.extractData(response);
  }

  async createMaterial(materialData: Partial<Material>): Promise<Material> {
    const response = await this.client.post('/api/v1/materials', materialData);
    return this.extractData(response);
  }

  async updateMaterial(partNumber: string, materialData: Partial<Material>): Promise<Material> {
    const response = await this.client.patch(`/api/v1/materials/${partNumber}`, materialData);
    return this.extractData(response);
  }

  // Employee Operations
  async getEmployees(params?: QueryParams): Promise<Employee[]> {
    const response = await this.client.get('/api/v1/employees', { params });
    return this.extractData(response);
  }

  async getEmployeeById(employeeID: string, params?: QueryParams): Promise<Employee> {
    const response = await this.client.get(`/api/v1/employees/${employeeID}`, { params });
    return this.extractData(response);
  }

  // Estimate Operations (Part Master)
  async getEstimates(params?: QueryParams): Promise<Estimate[]> {
    const response = await this.client.get('/api/v1/estimates', { params });
    return this.extractData(response);
  }

  async getEstimateByPartNumber(partNumber: string, params?: QueryParams): Promise<Estimate> {
    const response = await this.client.get(`/api/v1/estimates/${partNumber}`, { params });
    return this.extractData(response);
  }

  async createEstimate(estimateData: Partial<Estimate>): Promise<Estimate> {
    const response = await this.client.post('/api/v1/estimates', estimateData);
    return this.extractData(response);
  }

  async updateEstimate(partNumber: string, estimateData: Partial<Estimate>): Promise<void> {
    await this.client.put(`/api/v1/estimates/${partNumber}`, estimateData);
    // Update returns 204 No Content, so no data to extract
  }

  // Attendance Ticket Operations
  async getAttendanceTickets(params?: QueryParams): Promise<AttendanceTicket[]> {
    const response = await this.client.get('/api/v1/attendance-tickets', { params });
    return this.extractData(response);
  }

  async getAttendanceTicketById(ticketDate: string, employeeCode: number, params?: QueryParams): Promise<AttendanceTicket> {
    const response = await this.client.get(`/api/v1/attendance-tickets/${ticketDate}/employees/${employeeCode}`, { params });
    return this.extractData(response);
  }

  async createAttendanceTicket(ticketData: Partial<AttendanceTicket>): Promise<AttendanceTicket> {
    const response = await this.client.post('/api/v1/attendance-tickets', ticketData);
    return this.extractData(response);
  }

  // Attendance Ticket Detail Operations
  async getAttendanceTicketDetails(params?: QueryParams): Promise<AttendanceTicketDetail[]> {
    const response = await this.client.get('/api/v1/attendance-ticket-details', { params });
    return this.extractData(response);
  }

  async createAttendanceTicketDetail(ticketDate: string, employeeCode: number, detailData: Partial<AttendanceTicketDetail>): Promise<AttendanceTicketDetail> {
    const response = await this.client.post(`/api/v1/attendance-tickets/${ticketDate}/employees/${employeeCode}/attendance-ticket-details`, detailData);
    return this.extractData(response);
  }

  async updateAttendanceTicketDetail(id: number, detailData: Partial<AttendanceTicketDetail>): Promise<void> {
    await this.client.patch(`/api/v1/attendance-ticket-details/${id}`, detailData);
    // Update returns 204 No Content
  }

  // Attendance Report - convenience method for date range queries
  async getAttendanceReport(startDate: string, endDate: string, employeeCodes?: number[]): Promise<AttendanceTicketDetail[]> {
    const params: QueryParams = {
      'ticketDate[gte]': startDate,
      'ticketDate[lte]': endDate,
      sort: 'employeeCode,ticketDate,attendanceCode',
    };

    // If specific employees requested, filter by them
    if (employeeCodes && employeeCodes.length > 0) {
      params['employeeCode[in]'] = employeeCodes.join('|');
    }

    const response = await this.client.get('/api/v1/attendance-ticket-details', { params });
    return this.extractData(response);
  }

  // Generic API call method for custom endpoints
  async apiCall(method: string, endpoint: string, data?: any, params?: any): Promise<any> {
    // Ensure endpoint starts with /api/v1/ if not already present
    const url = endpoint.startsWith('/api/v1/') ? endpoint : `/api/v1/${endpoint.replace(/^\//, '')}`;

    const response = await this.client.request({
      method,
      url,
      data,
      params,
    });
    return this.extractData(response);
  }
}
