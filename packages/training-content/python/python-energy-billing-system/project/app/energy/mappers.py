from app.energy.models import Invoice
from app.energy.schemas import InvoiceResponse


def to_invoice_response(invoice: Invoice) -> InvoiceResponse:
    return InvoiceResponse(
        id=invoice.id,
        customer_id=invoice.customer_id,
        meter_id=invoice.meter_id,
        period_start=invoice.period_start,
        period_end=invoice.period_end,
        consumption_kwh=invoice.consumption_kwh,
        subtotal=invoice.subtotal,
        tax=invoice.tax,
        total=invoice.total,
        status=invoice.status,
    )
