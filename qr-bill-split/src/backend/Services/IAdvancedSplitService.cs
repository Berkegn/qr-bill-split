namespace QrBillSplit.Backend.Services;

/// <summary>
/// Defines advanced mathematical operations for bill splitting, strictly enforcing decimal precision and penny allocation.
/// </summary>
public interface IAdvancedSplitService
{
    /// <summary>
    /// Divides a single shared BillItem equally among specific users, allocating any repeating decimal remainders to the first user.
    /// </summary>
    /// <param name="tableId">The unique identifier of the table session.</param>
    /// <param name="itemId">The ID of the bill item to split.</param>
    /// <param name="userIds">The list of users participating in the split.</param>
    /// <returns>A dictionary mapping user IDs to their exact split allocation.</returns>
    Task<Dictionary<string, decimal>> SplitSharedItemAsync(string tableId, int itemId, List<string> userIds);

    /// <summary>
    /// Distributes a global tax and tip proportionally based on each user's base share.
    /// </summary>
    /// <param name="userBaseShares">A dictionary mapping user IDs to their base item totals.</param>
    /// <param name="taxPercent">The tax percentage to apply (e.g., 8.0 for 8%).</param>
    /// <param name="tipPercent">The tip percentage to apply (e.g., 15.0 for 15%).</param>
    /// <returns>A dictionary mapping user IDs to their final totals (Base + Proportional Tax + Proportional Tip).</returns>
    Dictionary<string, decimal> ApplyTaxAndTip(Dictionary<string, decimal> userBaseShares, decimal taxPercent, decimal tipPercent);
}
