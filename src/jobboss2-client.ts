import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  JobBOSS2Config,
  OAuthTokenResponse,
  QueryParams,
  Order,
  OrderLineItem,
  OrderLineItemUpdate,
  OrderRouting,
  OrderRoutingCreate,
  OrderRoutingUpdate,
  Customer,
  Quote,
  BinLocation,
  Material,
  MaterialCreate,
  Employee,
  Estimate,
  DocumentControl,
  DocumentHistory,
  DocumentReviewRecord,
  JobMaterial,
  JobRequirement,
  PackingListLineItem,
  PackingList,
  ProductCode,
  PurchaseOrderLineItem,
  PurchaseOrderRelease,
  PurchaseOrder,
  QuoteLineItem,
  ReportSubmissionResult,
  Salesperson,
  TimeTicketDetail,
  TimeTicket,
  Vendor,
  WorkCenter,
  RoutingCreate,
  AttendanceTicket,
  AttendanceTicketDetail
} from './types.js';

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
const URL_SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i;

export class JobBOSS2Client {
  private client: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;
  private tokenUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

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
          const statusText = error.response.statusText ? ` ${error.response.statusText}` : '';
          throw new Error(`JobBOSS2 API Error: ${error.response.status}${statusText}`);
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
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
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
        this.scheduleTokenRefresh();
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const statusText = error.response?.statusText ? ` ${error.response.statusText}` : '';
          throw new Error(`OAuth2 Token Error: ${error.response?.status ?? 'Unknown'}${statusText}`);
        }
        throw error;
      } finally {
        this.isRefreshing = false;
      }
    })();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private isTokenExpired(): boolean {
    return !this.accessToken || Date.now() >= this.tokenExpiry;
  }

  private scheduleTokenRefresh(): void {
    if (this.tokenExpiry <= 0) {
      return;
    }

    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }

    const refreshAt = this.tokenExpiry - 60_000;
    const delayMs = Math.max(refreshAt - Date.now(), 1_000);

    this.tokenRefreshTimer = setTimeout(async () => {
      if (this.isRefreshing) {
        return;
      }
      try {
        await this.fetchAccessToken();
      } catch {
        // Token refresh failures will be handled on the next request.
      }
    }, delayMs);
    this.tokenRefreshTimer.unref?.();
  }

  destroy(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  private async ensureValidToken(): Promise<void> {
    if (this.isTokenExpired()) {
      await this.fetchAccessToken();
    }
  }

  private normalizeMethod(method: string): string {
    const normalized = method.toUpperCase();
    if (!ALLOWED_METHODS.has(normalized)) {
      throw new Error(`Invalid HTTP method: ${method}`);
    }
    return normalized;
  }

  private normalizeEndpoint(endpoint: string): string {
    const trimmed = endpoint.trim();
    if (!trimmed) {
      throw new Error('Endpoint is required');
    }
    if (URL_SCHEME_RE.test(trimmed)) {
      throw new Error('Endpoint must be a relative path');
    }

    const normalized = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    if (normalized.includes('..') || normalized.includes('\\')) {
      throw new Error('Invalid endpoint path');
    }

    if (normalized === '/api/v1' || normalized.startsWith('/api/v1/') || normalized.startsWith('/oauth/')) {
      return normalized;
    }
    return `/api/v1${normalized}`;
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

  async updateOrderLineItem(
    orderNumber: string,
    itemNumber: number,
    itemData: Partial<OrderLineItemUpdate>
  ): Promise<OrderLineItem> {
    const response = await this.client.patch(`/api/v1/orders/${orderNumber}/order-line-items/${itemNumber}`, itemData);
    return this.extractData(response);
  }

  async getOrderRoutings(params?: QueryParams): Promise<OrderRouting[]> {
    const response = await this.client.get('/api/v1/order-routings', { params });
    return this.extractData(response);
  }

  async getOrderRouting(
    orderNumber: string,
    itemNumber: number,
    stepNumber: number,
    params?: QueryParams
  ): Promise<OrderRouting> {
    const response = await this.client.get(
      `/api/v1/orders/${orderNumber}/order-line-items/${itemNumber}/order-routings/${stepNumber}`,
      { params }
    );
    return this.extractData(response);
  }

  async createOrderRouting(orderNumber: string, itemNumber: number, routingData: OrderRoutingCreate): Promise<OrderRouting> {
    const response = await this.client.post(
      `/api/v1/orders/${orderNumber}/order-line-items/${itemNumber}/order-routings`,
      routingData
    );
    return this.extractData(response);
  }

  async updateOrderRouting(
    orderNumber: string,
    itemNumber: number,
    stepNumber: number,
    routingData: Partial<OrderRoutingUpdate>
  ): Promise<OrderRouting> {
    const response = await this.client.patch(
      `/api/v1/orders/${orderNumber}/order-line-items/${itemNumber}/order-routings/${stepNumber}`,
      routingData
    );
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

  // Material Operations
  async getMaterials(params?: QueryParams): Promise<Material[]> {
    const response = await this.client.get('/api/v1/materials', { params });
    return this.extractData(response);
  }

  async getMaterialByPartNumber(partNumber: string, params?: QueryParams): Promise<Material> {
    const response = await this.client.get(`/api/v1/materials/${partNumber}`, { params });
    return this.extractData(response);
  }

  async getBinLocations(params?: QueryParams): Promise<BinLocation[]> {
    const response = await this.client.get('/api/v1/bin-locations', { params });
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

  // Document operations
  async getDocumentControls(params?: QueryParams): Promise<DocumentControl[]> {
    const response = await this.client.get('/api/v1/document-controls', { params });
    return this.extractData(response);
  }

  async getDocumentHistories(params?: QueryParams): Promise<DocumentHistory[]> {
    const response = await this.client.get('/api/v1/document-histories', { params });
    return this.extractData(response);
  }

  async getDocumentReviews(params?: QueryParams): Promise<DocumentReviewRecord[]> {
    const response = await this.client.get('/api/v1/document-review', { params });
    return this.extractData(response);
  }

  // Job material and requirement operations
  async getJobMaterials(params?: QueryParams): Promise<JobMaterial[]> {
    const response = await this.client.get('/api/v1/job-materials', { params });
    return this.extractData(response);
  }

  async getJobMaterialById(uniqueID: string, params?: QueryParams): Promise<JobMaterial> {
    const response = await this.client.get(`/api/v1/job-materials/${uniqueID}`, { params });
    return this.extractData(response);
  }

  async getJobRequirements(params?: QueryParams): Promise<JobRequirement[]> {
    const response = await this.client.get('/api/v1/job-requirements', { params });
    return this.extractData(response);
  }

  async getJobRequirementById(uniqueID: string, params?: QueryParams): Promise<JobRequirement> {
    const response = await this.client.get(`/api/v1/job-requirements/${uniqueID}`, { params });
    return this.extractData(response);
  }

  // Packing list operations
  async getPackingListLineItems(params?: QueryParams): Promise<PackingListLineItem[]> {
    const response = await this.client.get('/api/v1/packing-list-line-items', { params });
    return this.extractData(response);
  }

  async getPackingLists(params?: QueryParams): Promise<PackingList[]> {
    const response = await this.client.get('/api/v1/packing-lists', { params });
    return this.extractData(response);
  }

  // Product code operations
  async getProductCodes(params?: QueryParams): Promise<ProductCode[]> {
    const response = await this.client.get('/api/v1/product-codes', { params });
    return this.extractData(response);
  }

  async getProductCode(productCode: string, params?: QueryParams): Promise<ProductCode> {
    const response = await this.client.get(`/api/v1/product-codes/${productCode}`, { params });
    return this.extractData(response);
  }

  // Purchase order operations
  async getPurchaseOrderLineItems(params?: QueryParams): Promise<PurchaseOrderLineItem[]> {
    const response = await this.client.get('/api/v1/purchase-order-line-items', { params });
    return this.extractData(response);
  }

  async getPurchaseOrderLineItem(
    purchaseOrderNumber: string,
    partNumber: string,
    itemNumber: number | string,
    params?: QueryParams
  ): Promise<PurchaseOrderLineItem> {
    const response = await this.client.get(
      `/api/v1/purchase-order-line-items/${purchaseOrderNumber}/${partNumber}/${itemNumber}`,
      { params }
    );
    return this.extractData(response);
  }

  async getPurchaseOrderReleases(params?: QueryParams): Promise<PurchaseOrderRelease[]> {
    const response = await this.client.get('/api/v1/purchase-order-releases', { params });
    return this.extractData(response);
  }

  async getPurchaseOrders(params?: QueryParams): Promise<PurchaseOrder[]> {
    const response = await this.client.get('/api/v1/purchase-orders', { params });
    return this.extractData(response);
  }

  async getPurchaseOrderByNumber(poNumber: string, params?: QueryParams): Promise<PurchaseOrder> {
    const response = await this.client.get(`/api/v1/purchase-orders/${poNumber}`, { params });
    return this.extractData(response);
  }

  // Quote line item operations
  async getQuoteLineItems(params?: QueryParams): Promise<QuoteLineItem[]> {
    const response = await this.client.get('/api/v1/quote-line-items', { params });
    return this.extractData(response);
  }

  async getQuoteLineItem(quoteNumber: string, itemNumber: number | string, params?: QueryParams): Promise<QuoteLineItem> {
    const response = await this.client.get(`/api/v1/quotes/${quoteNumber}/quote-line-item/${itemNumber}`, { params });
    return this.extractData(response);
  }

  async createQuoteLineItem(quoteNumber: string, payload: Partial<QuoteLineItem>): Promise<QuoteLineItem> {
    const response = await this.client.post(`/api/v1/quotes/${quoteNumber}/quote-line-items`, payload);
    return this.extractData(response);
  }

  async updateQuoteLineItem(
    quoteNumber: string,
    itemNumber: number | string,
    payload: Partial<QuoteLineItem>
  ): Promise<QuoteLineItem> {
    const response = await this.client.patch(
      `/api/v1/quotes/${quoteNumber}/quote-line-items/${itemNumber}`,
      payload
    );
    return this.extractData(response);
  }

  // Routing operations
  async getRoutings(params?: QueryParams): Promise<OrderRouting[]> {
    const response = await this.client.get('/api/v1/routings', { params });
    return this.extractData(response);
  }

  async getRoutingByPartNumber(partNumber: string, stepNumber: number | string, params?: QueryParams): Promise<OrderRouting> {
    const response = await this.client.get(`/api/v1/estimates/${partNumber}/routings/${stepNumber}`, { params });
    return this.extractData(response);
  }

  // Report operations
  async submitReportRequest(body: Record<string, any>): Promise<ReportSubmissionResult> {
    const response = await this.client.post('/api/v1/reports', body);
    return this.extractData(response);
  }

  async getReportRequest(requestId: string): Promise<ReportSubmissionResult> {
    const response = await this.client.get(`/api/v1/reports/${requestId}`);
    return this.extractData(response);
  }

  // Salesperson operations
  async getSalespersons(params?: QueryParams): Promise<Salesperson[]> {
    const response = await this.client.get('/api/v1/salespersons', { params });
    return this.extractData(response);
  }

  // Time ticket operations
  async getTimeTicketDetails(params?: QueryParams): Promise<TimeTicketDetail[]> {
    const response = await this.client.get('/api/v1/time-ticket-details', { params });
    return this.extractData(response);
  }

  async getTimeTicketDetailByGuid(timeTicketGUID: string, params?: QueryParams): Promise<TimeTicketDetail> {
    const response = await this.client.get(`/api/v1/time-ticket-details/${timeTicketGUID}`, { params });
    return this.extractData(response);
  }

  async getTimeTickets(params?: QueryParams): Promise<TimeTicket[]> {
    const response = await this.client.get('/api/v1/time-tickets', { params });
    return this.extractData(response);
  }

  async getTimeTicketById(ticketDate: string, employeeCode: string | number, params?: QueryParams): Promise<TimeTicket> {
    const response = await this.client.get(
      `/api/v1/time-tickets/${ticketDate}/employees/${employeeCode}`,
      { params }
    );
    return this.extractData(response);
  }

  // Vendor operations
  async getVendors(params?: QueryParams): Promise<Vendor[]> {
    const response = await this.client.get('/api/v1/vendors', { params });
    return this.extractData(response);
  }

  async getVendorByCode(vendorCode: string, params?: QueryParams): Promise<Vendor> {
    const response = await this.client.get(`/api/v1/vendors/${vendorCode}`, { params });
    return this.extractData(response);
  }

  // Work center operations
  async getWorkCenters(params?: QueryParams): Promise<WorkCenter[]> {
    const response = await this.client.get('/api/v1/work-centers', { params });
    return this.extractData(response);
  }

  async getWorkCenterByCode(workCenter: string, params?: QueryParams): Promise<WorkCenter> {
    const response = await this.client.get(`/api/v1/work-centers/${workCenter}`, { params });
    return this.extractData(response);
  }

  // Generic API call method for custom endpoints
  async apiCall(method: string, endpoint: string, data?: any, params?: any): Promise<any> {
    const normalizedMethod = this.normalizeMethod(method);
    const url = this.normalizeEndpoint(endpoint);

    const response = await this.client.request({
      method: normalizedMethod,
      url,
      data,
      params,
    });
    return this.extractData(response);
  }
}
