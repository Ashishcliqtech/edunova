const emptyListResponse = (res, message, key = "items", extra = {}) => {
  return res.status(200).json({
    success: true,
    message: message || "Not found",
    [key]: [],
    ...extra,
  });
};

module.exports = emptyListResponse;
