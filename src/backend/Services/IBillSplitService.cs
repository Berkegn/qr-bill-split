namespace QrBillSplit.Backend.Services;

public interface IBillSplitService
{
    /// <summary>
    /// Processes a partial payment towards a specific bill item.
    /// </summary>
    /// <param name="tableId">The unique identifier of the table session.</param>
    /// <param name="itemId">The unique identifier of the bill item.</param>
    /// <param name="amount">The partial amount to pay.</param>
    /// <param name="payingUserId">The ID of the user making the payment.</param>
    /// <returns>True if the payment was successful, false otherwise.</returns>
    /// <exception cref="PaymentFailedException">Thrown if payment rules are violated.</exception>
    Task<bool> PayPartialAsync(string tableId, int itemId, decimal amount, string payingUserId);

    /// <summary>
    /// Splits the remaining unpaid bill evenly among a list of users, securing cents distribution to avoid fractional loss.
    /// </summary>
    /// <param name="tableId">The unique identifier of the table session.</param>
    /// <param name="userIds">The list of users participating in the split.</param>
    /// <returns>A dictionary mapping user IDs to their respective calculated split amount.</returns>
    Task<Dictionary<string, decimal>> SplitRemainingAsync(string tableId, List<string> userIds);

    /// <summary>
    /// Plays a roulette game, locking a random unpaid item to a randomly selected participant.
    /// </summary>
    /// <param name="tableId">The unique identifier of the table session.</param>
    /// <param name="participantIds">The list of participants in the roulette.</param>
    /// <returns>A RouletteResult object containing the loser and the assigned item, or null if no unpaid items remain.</returns>
    Task<RouletteResult?> PlayRouletteAsync(string tableId, List<string> participantIds);
}

public class RouletteResult
{
    public string LoserUserId { get; set; } = string.Empty;
    public int ItemId { get; set; }
    public decimal Amount { get; set; }
    public string ItemName { get; set; } = string.Empty;
}
