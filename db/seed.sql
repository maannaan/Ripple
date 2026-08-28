-- Scenario A: Retail e-commerce SKU change (ACME-1847 → ACME-2847)

INSERT INTO products (product_id, sku, name, supplier, status) VALUES
    (1, 'ACME-1847', 'Widget A', 'SupplierX', 'active'),
    (2, 'BETA-9001', 'Widget B', 'SupplierY', 'active');

INSERT INTO purchase_orders (po_id, supplier, product_id, quantity, status) VALUES
    (101, 'SupplierX', 1, 50, 'pending'),
    (102, 'SupplierX', 1, 100, 'confirmed'),
    (103, 'SupplierY', 2, 20, 'pending');

INSERT INTO shipments (shipment_id, po_id, product_id, quantity, status) VALUES
    (5001, 101, 1, 50, 'delivered'),
    (5002, 102, 1, 30, 'transit'),
    (5003, 103, 2, 20, 'delivered');

INSERT INTO customer_orders (order_id, product_id, quantity, status, region) VALUES
    (9001, 1, 10, 'processing', 'East'),
    (9002, 1, 15, 'pending', 'West'),
    (9003, 2, 5, 'processing', 'East');

INSERT INTO pricing_rules (rule_id, product_id, price, region) VALUES
    (1, 1, 850.00, 'East'),
    (2, 1, 890.00, 'West'),
    (3, 2, 1500.00, 'East');
