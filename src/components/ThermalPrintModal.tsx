import * as React from 'react';
import { useState, useRef } from 'react';
import { Printer, X, Bluetooth, Check, RefreshCw, Smartphone, AlertCircle, HelpCircle } from 'lucide-react';
import { Order, BusinessConfig } from '../types';

interface ThermalPrintModalProps {
  order: Order | null;
  onClose: () => void;
  config: BusinessConfig;
}

export default function ThermalPrintModal({ order, onClose, config }: ThermalPrintModalProps) {
  const [printing, setPrinting] = useState<boolean>(false);
  const [btState, setBtState] = useState<'idle' | 'scanning' | 'connected' | 'sending' | 'success' | 'error'>('idle');
  const [btLog, setBtLog] = useState<string>('');
  const [btDeviceName, setBtDeviceName] = useState<string>('');
  
  // Keep references for bluetooth devices
  const activeDeviceRef = useRef<any>(null);
  const activeCharRef = useRef<any>(null);

  if (!order) return null;

  // Calculate Subtotal and other values based on order items
  const subtotal = order.items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const deliveryCharge = config.deliveryCharge || 0;
  const gstPercent = config.gstPercent || 0;
  const serviceFee = config.serviceFee || 0;
  const gstAmount = parseFloat((subtotal * gstPercent / 100).toFixed(2));
  const finalTotalCalculated = parseFloat((subtotal + deliveryCharge + gstAmount + serviceFee).toFixed(2));
  
  // Use either calculated or stored amount
  const displayedTotal = order.totalAmount || finalTotalCalculated;

  // Function to print via standard browser system styled for 80mm (3-inch) paper roll
  const handleSystemPrint = () => {
    setPrinting(true);
    try {
      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc) {
        throw new Error("Could not access iframe content window");
      }

      // Generate exact 80mm thermal paper receipt HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - Token ${order.token}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 10px;
                background: #fff;
                color: #000;
              }
            }
            body {
              width: 74mm;
              margin: 0 auto;
              padding: 15px;
              color: #000;
              background: #fff;
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              line-height: 1.3;
              text-rendering: optimizeSpeed;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .title {
              font-size: 16px;
              font-weight: 900;
              margin: 0 0 4px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .subtitle {
              font-size: 10px;
              color: #333;
              margin: 2px 0;
            }
            .divider {
              border-bottom: 1px dashed #000;
              margin: 8px 0;
            }
            .token-box {
              border: 1.5px solid #000;
              padding: 6px;
              margin: 8px auto;
              max-width: 80%;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
            }
            .item-table {
              width: 100%;
              border-collapse: collapse;
            }
            .item-table th {
              text-align: left;
              font-size: 11px;
              font-weight: bold;
              border-bottom: 1px dashed #000;
              padding-bottom: 4px;
            }
            .item-table td {
              font-size: 11px;
              padding: 4px 0;
              vertical-align: top;
            }
            .text-right {
              text-align: right;
            }
            .totals-table {
              width: 100%;
              margin-top: 5px;
            }
            .totals-table td {
              padding: 2.5px 0;
              font-size: 11px;
            }
            .grand-total {
              font-size: 14px;
              font-weight: bold;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 6px 0;
              margin-top: 4px;
            }
            .footer {
              margin-top: 15px;
              font-size: 10px;
              text-align: center;
            }
            .footer-qr {
              margin: 8px auto 4px auto;
              font-size: 9px;
              border: 1px solid #ddd;
              padding: 4px;
              max-width: 140px;
            }
          </style>
        </head>
        <body onload="window.print();">
          <div class="center">
            <h1 class="title">${config.name}</h1>
            <div class="subtitle">${config.address}</div>
            <div class="subtitle">Tel: ${config.contacts.join(' / ')}</div>
            <div class="divider"></div>
            
            <div class="token-box">
              TOKEN: ${order.token}
            </div>
            
            <div class="bold" style="font-size: 11px; margin-top: 6px;">
              TAX INVOICE
            </div>
          </div>

          <div class="subtitle" style="margin-top: 10px;">
            <b>Date:</b> ${new Date(order.createdAt).toLocaleString()}
          </div>
          <div class="subtitle">
            <b>Cust:</b> ${order.customerName}
          </div>
          <div class="subtitle">
            <b>Phone:</b> ${order.phone}
          </div>
          <div class="subtitle">
            <b>Status:</b> ${order.status.toUpperCase()}
          </div>

          <div class="divider"></div>

          <table class="item-table">
            <thead>
              <tr>
                <th style="width: 50%;">ITEM</th>
                <th style="width: 15%; text-align: center;">QTY</th>
                <th style="width: 15%; text-align: right;">RATE</th>
                <th style="width: 20%; text-align: right;">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(it => `
                <tr>
                  <td>${it.name}</td>
                  <td style="text-align: center;">${it.quantity}</td>
                  <td style="text-align: right;">${it.price}</td>
                  <td style="text-align: right;">${(it.price * it.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="divider"></div>

          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td class="text-right">₹${subtotal.toFixed(2)}</td>
            </tr>
            ${deliveryCharge > 0 ? `
            <tr>
              <td>Delivery Charge</td>
              <td class="text-right">₹${deliveryCharge.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${gstAmount > 0 ? `
            <tr>
              <td>GST (${gstPercent}%)</td>
              <td class="text-right">₹${gstAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            ${serviceFee > 0 ? `
            <tr>
              <td>Service Fee</td>
              <td class="text-right">₹${serviceFee.toFixed(2)}</td>
            </tr>
            ` : ''}
          </table>

          <div class="grand-total">
            <table class="totals-table" style="margin-top: 0;">
              <tr class="bold">
                <td style="font-size: 13px;">GRAND TOTAL</td>
                <td class="text-right" style="font-size: 14px;">₹${displayedTotal.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <div class="center subtitle" style="margin-top: 8px;">
            <b>Payment mode:</b> CASH ON DELIVERY / UPI DUE
          </div>

          <div class="divider"></div>

          <div class="footer">
            <div class="bold">THANK YOU & VISIT AGAIN!</div>
            <div style="font-size: 9px; margin-top: 4px; color: #555;">Basak Khana Khajana cooked fresh with love.</div>
            <div class="footer-qr">
              Scan UPI on Delivery to pay<br/>
              <b>₹${displayedTotal.toFixed(2)}</b>
            </div>
          </div>
        </body>
        </html>
      `;

      doc.open();
      doc.write(html);
      doc.close();

      // Give browser time to load iframe content & prompt printing
      setTimeout(() => {
        setPrinting(false);
        // Clean up iframe after short delay
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 5000);
      }, 800);
    } catch (err: any) {
      console.error(err);
      setPrinting(false);
      alert("Error printing: " + err.message);
    }
  };

  // Direct Web Bluetooth ESC/POS printer implementation
  const handleBluetoothPrint = async () => {
    setBtState('scanning');
    setBtLog('Requesting bluetooth printer devices...');
    
    try {
      // Look for any standard bluetooth device with name tags, or serial port profile
      const nav: any = navigator;
      if (!nav.bluetooth) {
        throw new Error("Web Bluetooth API is not supported in this browser. Try Google Chrome or Microsoft Edge on Android/Desktop.");
      }

      setBtLog("Scanning... Please select your Bluetooth Thermal (80mm) Printer.");
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '0000ffe0-0000-1000-8000-00805f9b34fb', // Generic custom, very common on Chinese PT-210 thermal printers
          '000018f0-0000-1000-8000-00805f9b34fb', // Generic wireless printer GATT profile
          '00001101-0000-1000-8000-00805f9b34fb'  // Classic Serial Port Profile
        ]
      });

      setBtDeviceName(device.name || "Bluetooth Printer");
      setBtLog(`Connecting to ${device.name || 'printer'}... Please wait.`);
      
      const server = await device.gatt.connect();
      activeDeviceRef.current = device;
      
      setBtLog("Locating printer write services...");
      
      // Try to list services and find character write UUID
      let service;
      let writeChar;

      // Common printer service UUID lists we attempt to query
      const servicesToTry = [
        '0000ffe0-0000-1000-8000-00805f9b34fb',
        '000018f0-0000-1000-8000-00805f9b34fb',
      ];

      for (const sId of servicesToTry) {
        try {
          service = await server.getPrimaryService(sId);
          if (service) break;
        } catch(e) { /* ignore */ }
      }

      // Fallback: If no known primary services could be queried, try to look up all primary services
      if (!service) {
        try {
          const services = await server.getPrimaryServices();
          if (services && services.length > 0) {
            service = services[0];
          }
        } catch(e) {}
      }

      if (!service) {
        throw new Error("Could not find standard GATT Printer Services. Please ensure printer is ON.");
      }

      setBtLog("Searching for printer data channels (Characteristics)...");
      try {
        const characteristics = await service.getCharacteristics();
        // find a characteristic that supports write / write without response
        writeChar = characteristics.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
      } catch (e) {}

      if (!writeChar) {
        // hard fallback to traditional BLE serial characteristic
        try {
          writeChar = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
        } catch(e) {}
      }

      if (!writeChar) {
        throw new Error("No writable characteristics found. Your bluetooth thermal printer GATT structure isn't accessible directly.");
      }

      activeCharRef.current = writeChar;
      setBtState('sending');
      setBtLog("Structuring ESC/POS high-speed layout...");

      // Build out thermal ESC/POS commands
      const encoder = new TextEncoder();
      const chunks: Uint8Array[] = [];

      // HELPER: Add ESC/POS specific bytes
      const initPrinter = new Uint8Array([0x1b, 0x40]); // ESC @
      const alignCenter = new Uint8Array([0x1b, 0x61, 0x01]); // ESC a 1
      const alignLeft = new Uint8Array([0x1b, 0x61, 0x00]); // ESC a 0
      const boldOn = new Uint8Array([0x1b, 0x45, 0x01]); // ESC E 1
      const boldOff = new Uint8Array([0x1b, 0x45, 0x00]); // ESC E 0
      const doubleSizeOn = new Uint8Array([0x1d, 0x21, 0x11]); // GS ! 0x11 (double size text)
      const doubleSizeOff = new Uint8Array([0x1d, 0x21, 0x00]); // GS ! 0x00
      const paperFeedCut = new Uint8Array([0x1b, 0x64, 0x05, 0x1d, 0x56, 0x41, 0x03]); // ESC d 5 (feed 5) + Cut

      // Build byte array string by string
      const addText = (text: string) => chunks.push(encoder.encode(text + "\r\n"));

      chunks.push(initPrinter);
      chunks.push(alignCenter);
      chunks.push(doubleSizeOn);
      chunks.push(boldOn);
      chunks.push(encoder.encode(`${config.name.toUpperCase()}\r\n`));
      chunks.push(doubleSizeOff);
      chunks.push(boldOff);

      addText(config.address);
      addText(`Tel: ${config.contacts.join(' / ')}`);
      
      chunks.push(alignCenter);
      addText("------------------------------------------------"); // 80mm has approx 48 chars
      
      chunks.push(doubleSizeOn);
      chunks.push(boldOn);
      chunks.push(encoder.encode(`TOKEN: ${order.token}\r\n`));
      chunks.push(doubleSizeOff);
      chunks.push(boldOff);
      
      addText("------------------------------------------------");
      chunks.push(alignLeft);
      addText(`Date  : ${new Date(order.createdAt).toLocaleString()}`);
      addText(`Cust  : ${order.customerName}`);
      addText(`Phone : ${order.phone}`);
      addText(`Status: ${order.status.toUpperCase()}`);
      addText("------------------------------------------------");
      
      // Items list table
      chunks.push(boldOn);
      // Width allocations: Item (26 cols) | Qty (5 cols) | Rate (7 cols) | Total (10 cols) = 48 cols
      addText("ITEM                       QTY   RATE    TOTAL");
      chunks.push(boldOff);
      addText("------------------------------------------------");
      
      order.items.forEach(it => {
        let namePart = it.name;
        if (namePart.length > 25) {
          namePart = namePart.substring(0, 22) + "...";
        }
        // Pad spacing
        const itemCol = namePart.padEnd(26, ' ');
        const qtyCol = ("" + it.quantity).padStart(4, ' ') + "  ";
        const rateCol = ("Rs" + it.price).padStart(7, ' ');
        const totalCol = ("Rs" + (it.price * it.quantity)).padStart(9, ' ');
        addText(`${itemCol}${qtyCol}${rateCol}${totalCol}`);
      });
      
      addText("------------------------------------------------");
      
      // Totals
      chunks.push(alignLeft);
      const padLeft = (label: string, val: string) => {
        const totalLen = 48;
        const spacesNeed = totalLen - label.length - val.length;
        addText(`${label}${" ".repeat(Math.max(1, spacesNeed))}${val}`);
      };

      padLeft("Subtotal:", `Rs ${subtotal.toFixed(2)}`);
      if (deliveryCharge > 0) {
        padLeft("Delivery Charge:", `Rs ${deliveryCharge.toFixed(2)}`);
      }
      if (gstAmount > 0) {
        padLeft(`GST (${gstPercent}%):`, `Rs ${gstAmount.toFixed(2)}`);
      }
      if (serviceFee > 0) {
        padLeft("Service Fee:", `Rs ${serviceFee.toFixed(2)}`);
      }
      
      addText("------------------------------------------------");
      chunks.push(boldOn);
      padLeft("GRAND TOTAL:", `Rs ${displayedTotal.toFixed(2)}`);
      chunks.push(boldOff);
      addText("------------------------------------------------");
      
      chunks.push(alignCenter);
      addText(`Payment mode: CASH ON DELIVERY / UPI DUE`);
      addText("");
      chunks.push(boldOn);
      addText("THANK YOU & VISIT AGAIN!");
      chunks.push(boldOff);
      addText("Basak Khana Khajana cooked fresh with love.");
      addText("\r\n\r\n\r\n");
      chunks.push(paperFeedCut);

      // Concatenate all fragments into a single byte stream
      const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
      const stream = new Uint8Array(totalLen);
      let offset = 0;
      for (const piece of chunks) {
        stream.set(piece, offset);
        offset += piece.length;
      }

      setBtLog("Transmitting data directly into Bluetooth thermal printer...");
      
      // Write in MTU safe byte packages (BLE typically runs 20-byte or 100-byte packets)
      const maxMtuSize = 100;
      for (let i = 0; i < stream.length; i += maxMtuSize) {
        const chunkSlice = stream.slice(i, i + maxMtuSize);
        await writeChar.writeValue(chunkSlice);
        // micro-delay to let the bluetooth printer handle buffers cleanly
        await new Promise(r => setTimeout(r, 45));
      }

      setBtState('success');
      setBtLog("🎉 Receipt printed successfully via direct Bluetooth connection!");
      
      // Disconnect cleanly after 3 seconds
      setTimeout(() => {
        try {
          if (activeDeviceRef.current && activeDeviceRef.current.gatt.connected) {
            activeDeviceRef.current.gatt.disconnect();
          }
        } catch(e) {}
        setBtState('idle');
      }, 3500);

    } catch (err: any) {
      console.error(err);
      setBtState('error');
      setBtLog(`Error: ${err.message || "Failed printing over bluetooth. Confirm device is turned ON, close surrounding Bluetooth host apps & retry."}`);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-orange-500 animate-pulse" />
            <div>
              <h3 className="text-sm font-black tracking-wider uppercase font-sans">
                80mm Thermal Receipt Options
              </h3>
              <p className="text-[10px] text-stone-300 font-mono mt-0.5">
                Token: {order.token} &bull; {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-800 rounded-full transition cursor-pointer text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-stone-50">
          
          {/* Quick Informational Notice */}
          <div className="bg-orange-50 border border-orange-200/50 p-3 rounded-2xl flex gap-2.5 text-stone-800 text-xs">
            <HelpCircle className="w-4 h-4 text-orange-800 flex-shrink-0 mt-0.5" />
            <div className="space-y-1.5 leading-relaxed">
              <p className="font-bold text-[11px] uppercase tracking-wider text-orange-950">How to Print?</p>
              <p className="text-stone-600 text-[11px]">
                <b>Option 1 (System Print)</b>: Perfect & 100% reliable fallbacks. Simply select any thermal Bluetooth or USB/Wi-Fi printer configured in your computer or mobile system as the destination. We styled this template specifically for 3-inch (80mm) receipt paper size rolling.
              </p>
              <p className="text-stone-600 text-[11px]">
                <b>Option 2 (Direct Bluetooth ESC/POS)</b>: Works in browsers that support Web Bluetooth (e.g., Google Chrome, Microsoft Edge) to pair and send raw signals instantly to thermal printers (like PT-210).
              </p>
              <div className="pt-1.5 border-t border-dashed border-orange-900/10 mt-1">
                <p className="text-orange-900 font-bold text-[10px] uppercase tracking-wider">
                  ⚠️ Note on Browser Security
                </p>
                <p className="text-stone-600 text-[11px] mt-0.5">
                  If the preview frame displays a "disallowed by permissions policy" error, please <b>open the website in a new tab/window</b> (using the diagonal arrow button in the top right, or using the Shared App URL). Secure features like Web Bluetooth require direct top-level access to request devices!
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* System Print Action Card */}
            <button
              id="print-btn-sys"
              onClick={handleSystemPrint}
              disabled={printing}
              className="p-5 bg-white border border-stone-200 rounded-2xl hover:border-orange-500 hover:shadow-md transition text-left flex flex-col justify-between h-44 cursor-pointer disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-900 border border-orange-100">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-stone-900 uppercase tracking-wider">
                  Option 1: System Print
                </h4>
                <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">
                  Best for any USB, Wi-Fi or Bluetooth Printer. Fits 80mm rolls automatically.
                </p>
              </div>
              <span className="text-[10px] font-black text-orange-850 uppercase tracking-widest flex items-center gap-1">
                {printing ? "Launching Print Screen..." : "Trigger System Print →"}
              </span>
            </button>

            {/* Bluetooth Direct Action Card */}
            <button
              id="print-btn-bt"
              onClick={handleBluetoothPrint}
              disabled={btState === 'scanning' || btState === 'sending'}
              className="p-5 bg-white border border-stone-200 rounded-2xl hover:border-orange-500 hover:shadow-md transition text-left flex flex-col justify-between h-44 cursor-pointer disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-950 border border-orange-100">
                <Bluetooth className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-stone-900 uppercase tracking-wider">
                  Option 2: Direct Bluetooth
                </h4>
                <p className="text-[10px] text-stone-500 mt-1 leading-relaxed">
                  Connect & send raw ESC/POS values via physical Bluetooth pairing.
                </p>
              </div>
              <span className="text-[10px] font-black text-orange-850 uppercase tracking-widest">
                {btState === 'scanning' && "Scanning Pair..."}
                {btState === 'sending' && "Sending Stream..."}
                {btState === 'success' && "Printed successfully ✓"}
                {btState === 'idle' && "Direct Bluetooth Pair →"}
                {btState === 'error' && "Bluetooth failed ✕"}
              </span>
            </button>
          </div>

          {/* Bluetooth Log Outputs */}
          {btState !== 'idle' && (
            <div className="bg-stone-900 p-3.5 rounded-xl text-[11px] font-mono text-stone-300 leading-relaxed border border-stone-800">
              <span className="font-bold text-orange-400 block mb-1">Pairing Log:</span>
              <p>{btLog}</p>
              {btDeviceName && (
                <p className="mt-1 text-emerald-400">
                  <b>Target device:</b> {btDeviceName}
                </p>
              )}
            </div>
          )}

          {/* Interactive Printed Ticket Preview */}
          <div>
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest block mb-2">
              Virtual Ticket Preview (80mm width standard)
            </span>
            <div className="bg-white border-2 border-dashed border-stone-300 rounded-2xl p-5 shadow-inner max-w-sm mx-auto text-stone-900 font-mono text-[11px] space-y-2 leading-tight">
              
              <div className="text-center space-y-0.5">
                <span className="text-xs font-black block uppercase tracking-wider">{config.name}</span>
                <p className="text-[9px] text-stone-500">{config.address}</p>
                <p className="text-[9px] text-stone-500 font-mono">Ph: {config.contacts.join(' / ')}</p>
                <div className="border-b border-dashed border-stone-300 my-2"></div>
                <div className="border border-stone-800 py-1 px-3 inline-block font-black text-xs my-1 bg-stone-50">
                  TOKEN: {order.token}
                </div>
                <p className="text-[9px] font-bold mt-1">TAX INVOICE</p>
              </div>

              <div className="space-y-0.5 text-[10px] text-stone-600 pt-1.5">
                <p><b>Date :</b> {new Date(order.createdAt).toLocaleString()}</p>
                <p><b>Cust :</b> {order.customerName}</p>
                <p><b>Phone:</b> {order.phone}</p>
              </div>

              <div className="border-b border-dashed border-stone-300 my-2"></div>

              {/* Items */}
              <div className="space-y-1">
                <div className="flex justify-between font-black text-[10px] text-stone-800">
                  <span>ITEM</span>
                  <div className="flex gap-4">
                    <span>QTY</span>
                    <span>TOTAL</span>
                  </div>
                </div>
                <div className="border-b border-dashed border-stone-300 my-1"></div>
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-stone-700">
                    <span className="truncate max-w-[160px]">{it.name}</span>
                    <div className="flex gap-6">
                      <span className="font-bold text-orange-600 font-mono text-[11px]">x{it.quantity}</span>
                      <span>₹{it.price * it.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-stone-300 my-2"></div>

              {/* Totals */}
              <div className="space-y-1 text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                {deliveryCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Charge</span>
                    <span>₹{deliveryCharge.toFixed(2)}</span>
                  </div>
                )}
                {gstAmount > 0 && (
                  <div className="flex justify-between">
                    <span>GST ({gstPercent}%)</span>
                    <span>₹{gstAmount.toFixed(2)}</span>
                  </div>
                )}
                {serviceFee > 0 && (
                  <div className="flex justify-between">
                    <span>Service Fee</span>
                    <span>₹{serviceFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-b border-dashed border-stone-300 my-2"></div>
                <div className="flex justify-between font-black text-stone-900 text-xs py-0.5">
                  <span>GRAND TOTAL</span>
                  <span>₹{displayedTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-3 text-[9px] text-stone-500 space-y-0.5">
                <span className="font-black text-stone-800 block">THANK YOU & VISIT AGAIN!</span>
                <p>Basak Khana Khajana cooked fresh with love.</p>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl text-xs font-black transition cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
