
export default function useOrderCalculations({orderHeader, orderItems}){
    const itemSubtotal = orderItems.reduce((acc, item) => {
        return acc + ((item.quantity || 0) * (item.rate || 0) * (1 - (item.discount_percentage || 0) / 100));
    }, 0);
    
    const packingCharges = parseFloat(orderHeader.packing_charges || 0);
    const freightCharges = parseFloat(orderHeader.freight_charges || 0);
    const taxRate = parseFloat(orderHeader.tax_rate || 18); 
    const taxableAmount = itemSubtotal + packingCharges + freightCharges;
    const taxAmount = taxableAmount * (taxRate / 100);
    const grandTotal = taxableAmount + taxAmount;

    return{totals: {itemSubtotal, packingCharges, freightCharges, taxRate, taxableAmount, taxAmount, grandTotal}
    };
} 