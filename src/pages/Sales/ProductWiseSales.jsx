import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import axios from "axios";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { Link } from "react-router";
import TruckLoader from "../../components/Spinner/TruckLoader";

const ProductWiseSales = ({
  fetchUrl = `${import.meta.env.VITE_API_BASE_URL}/api/sales/product-sales`,
  title = "Product Sales Analytics"
}) => {
  const [products, setProducts] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [search, setSearch] =
    useState("");
  const [expanded, setExpanded] =
    useState(null);

  const fetchData =
    useCallback(async () => {
      setLoading(true);

      try {
        const res =
          await axios.get(
            fetchUrl
          );

        setProducts(
          res.data.data || []
        );
      } catch (err) {
        toast.error(
          "Failed to sync product sales"
        );
      } finally {
        setLoading(false);
      }
    }, [fetchUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportExcel =
    () => {
      const rows =
        products.flatMap(
          (product) =>
            product.sales.map(
              (sale) => ({
                Product:
                  product.product_name,

                ProductID:
                  product.product_id,

                MemoNo:
                  sale.memoNo,

                Customer:
                  sale.customer_name ||
                  "Walk-in",

                Qty:
                  sale.qty,

                SalePrice:
                  sale.sale_price,

                Subtotal:
                  sale.subtotal,

                Paid:
                  sale.paid_amount,

                Due:
                  sale.due_amount,

                PaymentMethod:
                  sale.payment_method ||
                  "N/A",

                Date:
                  format(
                    new Date(
                      sale.date
                    ),
                    "yyyy-MM-dd HH:mm"
                  ),
              })
            )
        );

      const ws =
        XLSX.utils.json_to_sheet(
          rows
        );

      const wb =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        wb,
        ws,
        "Product Sales"
      );

      XLSX.writeFile(
        wb,
        "Product_Sales_Report.xlsx"
      );
    };

  const filteredProducts =
    useMemo(() => {
      return products.filter(
        (p) =>
          p.product_name
            ?.toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );
    }, [products, search]);

  const stats = useMemo(() => {
    return {
      totalProducts:
        products.length,

      totalQty:
        products.reduce(
          (sum, p) =>
            sum +
            (p.total_qty || 0),
          0
        ),

      totalAmount:
        products.reduce(
          (sum, p) =>
            sum +
            (p.total_sale_amount ||
              0),
          0
        ),
    };
  }, [products]);

  if (loading)
    return <TruckLoader />;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800">
            {title}
          </h1>

          <p className="text-gray-500 text-sm">
            Managing{" "}
            {
              products.length
            }{" "}
            products
          </p>
        </div>

        <button
          onClick={
            handleExportExcel
          }
          className="bg-green-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-green-700 transition"
        >
          📥 Excel
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-6 border-l-4 border-blue-500 shadow-sm">
          <p className="text-xs uppercase text-gray-400 font-bold">
            Total Products
          </p>

          <p className="text-3xl font-black">
            {
              stats.totalProducts
            }
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border-l-4 border-emerald-500 shadow-sm">
          <p className="text-xs uppercase text-gray-400 font-bold">
            Total Sold Qty
          </p>

          <p className="text-3xl font-black text-emerald-600">
            {stats.totalQty.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border-l-4 border-orange-500 shadow-sm">
          <p className="text-xs uppercase text-gray-400 font-bold">
            Total Sales
          </p>

          <p className="text-3xl font-black text-orange-600">
            ৳
            {stats.totalAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search product..."
        value={search}
        onChange={(e) =>
          setSearch(
            e.target.value
          )
        }
        className="w-full p-4 rounded-2xl border border-gray-200 mb-6 outline-none focus:border-orange-500"
      />

      {/* Table */}
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-left">
                Product
              </th>

              <th className="p-4 text-center">
                Sales Count
              </th>

              <th className="p-4 text-center">
                Sold Qty
              </th>

              <th className="p-4 text-right">
                Avg Price
              </th>

              <th className="p-4 text-right">
                Total Sales
              </th>

              <th className="p-4 text-center">
                Last Sale
              </th>

              <th className="p-4 text-center">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map(
              (
                product,
                idx
              ) => (
                <React.Fragment
                  key={
                    product.product_id
                  }
                >
                  <tr className="border-b hover:bg-gray-50 transition">
                    <td className="p-4 font-semibold">
                      {
                        product.product_name
                      }
                    </td>

                    <td className="text-center">
                      {
                        product.total_sale_count
                      }
                    </td>

                    <td className="text-center font-bold text-emerald-600">
                      {
                        product.total_qty
                      }
                    </td>

                    <td className="text-right">
                      ৳
                      {
                        product.avg_sale_price
                      }
                    </td>

                    <td className="text-right font-bold">
                      ৳
                      {product.total_sale_amount.toLocaleString()}
                    </td>

                    <td className="text-center text-sm">
                      {format(
                        new Date(
                          product.last_sale_date
                        ),
                        "Pp"
                      )}
                    </td>

                    <td className="text-center">
                      <button
                        onClick={() =>
                          setExpanded(
                            expanded ===
                              idx
                              ? null
                              : idx
                          )
                        }
                        className="text-orange-600 font-bold hover:text-orange-700"
                      >
                        {expanded ===
                        idx
                          ? "Hide"
                          : "Details"}
                      </button>
                    </td>
                  </tr>

                  {expanded ===
                    idx && (
                    <tr>
                      <td
                        colSpan={
                          7
                        }
                        className="bg-gray-50 p-5"
                      >
                        <div className="space-y-3">
                          {product.sales.map(
                            (
                              sale
                            ) => (
                              <div
                                key={
                                  sale._id
                                }
                                className="flex justify-between items-center bg-white p-4 rounded-xl border hover:shadow-sm transition"
                              >
                                <div>
                                  <p className="font-bold">
                                    {
                                      sale.customer_name
                                    }
                                  </p>

                                  <p className="text-sm text-gray-500">
                                    Memo:{" "}
                                    {
                                      sale.memoNo
                                    }
                                  </p>

                                  <p className="text-sm text-gray-500">
                                    {format(
                                      new Date(
                                        sale.date
                                      ),
                                      "Pp"
                                    )}
                                  </p>

                                  <div className="mt-3">
                                    <Link
                                      to={`/sales/${sale._id}`}
                                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition"
                                    >
                                      ✏️ Edit Sale
                                    </Link>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <p>
                                    Qty:{" "}
                                    <b>
                                      {
                                        sale.qty
                                      }
                                    </b>
                                  </p>

                                  <p>
                                    Price:
                                    ৳
                                    {
                                      sale.sale_price
                                    }
                                  </p>

                                  <p className="font-bold text-orange-600">
                                    ৳
                                    {
                                      sale.subtotal
                                    }
                                  </p>

                                  <p
                                    className={`text-sm font-semibold ${
                                      sale.due_amount >
                                      0
                                        ? "text-red-500"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {sale.due_amount >
                                    0
                                      ? `Due ৳${sale.due_amount}`
                                      : "Paid"}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            )}
          </tbody>
        </table>

        {filteredProducts.length ===
          0 && (
          <div className="p-20 text-center text-gray-400 italic">
            No matching
            records found
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductWiseSales;